from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from flask_migrate import Migrate

from passlib.hash import sha256_crypt
from dotenv import dotenv_values
import os


CONF = dotenv_values('.env')

__app__ = Flask(
    __name__,
    static_url_path='', 
    static_folder='static',
    template_folder='templates'
)
__app__.config['SECRET_KEY'] = CONF['SECRET']

__app__.url_map.strict_slashes = False

# DATABASE
__app__.config['SQLALCHEMY_DATABASE_URI'] = CONF['DB_URI']
__app__.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(__app__)
migrate = Migrate(__app__, db)

# LOGIN MANAGER
login_manager = LoginManager(__app__)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(id = user_id).first()

from .data_loader import MapData
vmap = MapData()

from .invaders_img_data import ImagesScraper
scraper = ImagesScraper()

@__app__.route('/')
def home():
    return render_template('index.html', users = User.query.all())

@__app__.route('/map')
@login_required
def map():
    return render_template('map.html', invaders = Invader.query.all())

@__app__.route('/profile')
@login_required
def my_profile():
    return redirect(url_for('user_profile', username = current_user.name))


@__app__.route('/user/<username>')
def user_profile(username: str):
    user = User.query.filter_by(name = username).first()
    exists = bool(user)
    return render_template('profile.html', user = user, exists = exists, invaders = Invader.query.all())

from .forms import LoginForm, RegistrationForm, EditProfileForm

@__app__.route('/profile/settings', methods = ['GET', 'POST'])
@login_required
def profile_settings():
    form = EditProfileForm()
    if form.validate_on_submit():
        if sha256_crypt.verify(form.password.data, current_user.passwd):
            if form.new_password.data:
                hashed_password = sha256_crypt.hash(form.new_password.data)
                current_user.passwd = hashed_password
            if form.username.data:
                current_user.name = form.username.data
            db.session.commit()
            next_page = request.args.get('next')
            return redirect(next_page or url_for('map'))
    elif request.method == 'GET':
        form.username.data = current_user.name
    return render_template('settings.html', form = form)

@__app__.route('/login', methods = ['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('map'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(name = form.username.data).first()
        if user and sha256_crypt.verify(form.password.data, user.passwd):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('map'))
    return render_template('login.html', form = form)

@__app__.route('/signup', methods = ['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('map'))
    form = RegistrationForm()
    if form.validate_on_submit():
        # Adding the user to the database
        hashed_password = sha256_crypt.hash(form.password.data)
        user = User(
            name = form.username.data,
            passwd = hashed_password
        )
        db.session.add(user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('signup.html', form = form)

@__app__.route('/logout')
def logout():
    if current_user.is_authenticated:
        logout_user()
    return redirect(url_for('map'))

@__app__.route('/stats')
def stats():
    return render_template('stats.html', invaders = Invader.query.all())

### API ###

@__app__.route('/api/map')
def get_map():
    return jsonify(vmap.all())

@__app__.route('/api/claim-invader', methods = ['POST'])
def claim_invader():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({
            'error': 'Missing one argument.'
        })
    
    vmap.claim_invader(lat, lng)
    return jsonify({
        'message': 'Invader claimed successfully.'
    })

@__app__.route('/api/invader-does-not-exist', methods = ['POST'])
def invader_does_not_exist():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    state = data.get('state')

    if not lat or not lng:
        return jsonify({
            'error': 'Missing one argument.'
        })
    vmap.invader_does_not_exist(lat, lng, state)
    return jsonify({
        'message': 'Invader status changed successfully.'
    })

@__app__.route('/api/add-invader', methods = ['POST'])
def add_invader():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    city = data.get('city')
    inv_id = data.get('inv_id')

    if not lat or not lng:
        return jsonify({
            'error': 'Missing one argument.'
        })
    
    vmap.add_invader(lat, lng, city, inv_id)
    return jsonify({
        'message': 'Invader added successfuly'
    })

@__app__.route('/api/delete-invader', methods = ['POST'])
def delete_invader():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({
            'error': 'Missing one argument.'
        })
    
    vmap.delete_invader(lat, lng)
    return jsonify({
        'message': 'Invader removed successfully.'
    })

@__app__.route('/api/current-user', methods = ['GET'])
def get_current_user():
    return jsonify({
        'current_user': current_user.as_json() if current_user.is_authenticated else None
    })

@__app__.route('/api/get-user', methods = ['GET'])
def get_user():
    data = request.args
    name = data.get('user')

    if not name:
        return jsonify({
            'error': 'Missing user argument.'
        })
    
    user = User.query.filter_by(name = name).first()
    if not user:
        return jsonify({
            'error': f'User {name} does not exist.'
        })

    return jsonify({
        'user': user.as_json()
    })

@__app__.route('/api/get-invader-image', methods = ['GET'])
def get_invader_image():
    data = request.args

    city = data.get('city')
    inv_id = data.get('inv_id')

    if not (city and inv_id):
        return jsonify({
            'error': 'Missing parameters (city and inv_id are required).'
        })

    inv_id = int(inv_id)

    return jsonify({ 'img' : scraper.get_image_link(city, inv_id) })

@__app__.route('/api/get-cities')
def get_cities():
    return jsonify({ 'cities' : scraper.get_cities() })

from .models import Invader, User