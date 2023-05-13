from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

from dotenv import dotenv_values

CONF = dotenv_values('.env')

__app__ = Flask(
    __name__,
    static_url_path='', 
    static_folder='static',
    template_folder='templates'
)
__app__.url_map.strict_slashes = False

__app__.config['SECRET'] = CONF['SECRET']

@__app__.route('/')
def map():
    return render_template('index.html')