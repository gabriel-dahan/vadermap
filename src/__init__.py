from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

from dotenv import dotenv_values
import json

from .data_loader import MapData, get_formated_deltatime

CONF = dotenv_values('.env')

__app__ = Flask(
    __name__,
    static_url_path='', 
    static_folder='static',
    template_folder='templates'
)
__app__.url_map.strict_slashes = False

__app__.config['SECRET'] = CONF['SECRET']

vmap = MapData()

@__app__.route('/')
def map():
    return render_template('index.html', format_deltatime = get_formated_deltatime, data = vmap.all())

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