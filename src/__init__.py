from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user, login_user, login_required, logout_user

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

# LOGIN MANAGER
login_manager = LoginManager(__app__)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(id = user_id).first()

from .data_loader import MapData

vmap = MapData()

@__app__.route('/')
@login_required
def map():
    return render_template('index.html')

from .forms import LoginForm, RegistrationForm

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

### API ###

@__app__.route('/api/map')
def get_map():
    return jsonify(vmap.all())

@__app__.route('/api/add-invader', methods = ['POST'])
def add_invader():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({
            'error': 'Missing one argument.'
        })
    
    vmap.add_invader(lat, lng)
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
        'message': 'Invader removed successfuly'
    })

@__app__.route('/api/current-user', methods = ['GET'])
def get_current_user():
    return jsonify({
        'current_user': current_user.as_json()
    })

from .models import Invader, User