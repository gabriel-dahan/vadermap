from . import db

from typing import List
from datetime import datetime

users_invaders = db.Table('users_invaders',
    db.Column('invader_id', db.Integer, db.ForeignKey('invaders.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'))
)

class Invader(db.Model):
    __tablename__ = 'invaders'

    id: int = db.Column(db.Integer, primary_key = True)
    lat: float = db.Column(db.Float, nullable = False)
    lng: float = db.Column(db.Float, nullable = False)
    date: datetime = db.Column(db.DateTime, default = datetime.now, nullable = False)

    def as_json(self) -> dict:
        return {**self.as_json_norel(), **{
            'users': [user.as_json_norel() for user in self.users]
        }}

    def as_json_norel(self) -> dict:
        return {
            'id': self.id,
            'lat': self.lat,
            'lng': self.lng,
            'date': self.date.isoformat()
        }

    def __repr__(self) -> str:
        return f'Invader(lat: {self.lat}, lng: {self.lng}, date: {self.date.isoformat()})'

class User(db.Model):
    __tablename__ = 'users'

    id: float = db.Column(db.Integer, primary_key = True)
    name: str = db.Column(db.String(20), unique = True, nullable = False)
    passwd: str = db.Column(db.String(80), nullable = False)

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
            'name': self.name
        }

    def __repr__(self) -> str:
        return f'User(name: {self.name})'