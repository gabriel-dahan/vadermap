from flask_login import UserMixin

from . import db

from typing import Literal
from datetime import datetime

users_invaders = db.Table('users_invaders',
    db.Column('invader_id', db.Integer, db.ForeignKey('invaders.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'))
)

def match_state(state: Literal[0, 1, 2]) -> str:
    match state:
        case 1:
            return 'Nonexistent'
        case 2:
            return 'Destroyed'
        case 3:
            return 'Damaged'
        case _:
            return 'Existent'

class Invader(db.Model):
    __tablename__ = 'invaders'

    id: int = db.Column(db.Integer, primary_key = True)
    lat: float = db.Column(db.Float, nullable = False)
    lng: float = db.Column(db.Float, nullable = False)

    # Identification (e.g. PA_120 -> city : PA ; inv_id : 120)
    inv_id: int = db.Column(db.Integer, nullable = True)
    city: str = db.Column(db.String(5), nullable = True)

    date: datetime = db.Column(db.DateTime, default = datetime.now, nullable = False)
    state: int = db.Column(db.Integer, nullable = False, server_default = '0') # 0 if existent, 1 if non-existent, 2 if destroyed, 3 if damaged.

    def as_json(self) -> dict:
        return {**self.as_json_norel(), **{
            'users': [user.as_json_norel() for user in self.users]
        }}

    def as_json_norel(self) -> dict:
        return {
            'id': self.id,
            'lat': self.lat,
            'lng': self.lng,
            'inv_id': self.inv_id,
            'city': self.city,
            'date': self.date.isoformat(),
            'state': self.state
        }

    def __repr__(self) -> str:
        return f'Invader(lat: {self.lat}, lng: {self.lng}, invader_name: {self.city}_{self.inv_id}, date: {self.date.isoformat()}, state: {match_state(self.state)})'

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id: float = db.Column(db.Integer, primary_key = True)
    name: str = db.Column(db.String(20), unique = True, nullable = False)
    passwd: str = db.Column(db.String(80), nullable = False)
    privileges: int = db.Column(db.Integer, server_default = '0')

    # INVADERS RELATIONSHIP
    invaders = db.relationship('Invader', secondary = users_invaders, backref='users') # Many-to-Many

    def as_json(self):
        return {**self.as_json_norel(), **{
            'invaders': [invader.as_json_norel() for invader in self.invaders]
        }}
    
    def as_json_norel(self):
        """ Returns the User object without relations to other tables (e.g. self.invaders). """
        return {
            'id': self.id,
            'name': self.name,
            'privileges': self.privileges or 0
        }

    def __repr__(self) -> str:
        return f'User(name: {self.name})'