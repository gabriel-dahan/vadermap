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
            return 'Unknown'

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
    comment: str = db.Column(db.Text)

    # RELATIONSHIPS
    logs = db.relationship('Action', backref = 'invader', cascade = 'all, delete-orphan') # One-to-Many

    def get_full_id(self) -> str:
        return f'{self.city}_{self.inv_id}'

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
            'state': self.state,
            'comment': self.comment,
            'full_id': self.get_full_id()
        }

    def __repr__(self) -> str:
        return f'Invader(lat: {self.lat}, lng: {self.lng}, invader_name: {self.get_full_id()}, date: {self.date.isoformat()}, state: {match_state(self.state)})'

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id: int = db.Column(db.Integer, primary_key = True)
    name: str = db.Column(db.String(20), unique = True, nullable = False)
    passwd: str = db.Column(db.String(80), nullable = False)
    privileges: int = db.Column(db.Integer, server_default = '0')
    theme: int = db.Column(db.Integer, server_default = '0') # 0 -> dark ; 1 -> light
    patchnote_seen: bool = db.Column(db.Boolean, server_default = db.text('false'))
    is_online: bool = db.Column(db.Boolean, server_default = db.text('false'))

    # ACTIONS
    actions = db.relationship('Action', backref = 'user', lazy = True) # One-to-Many

    # INVADERS RELATIONSHIP
    invaders = db.relationship('Invader', secondary = users_invaders, backref = 'users') # Many-to-Many

    def as_json(self):
        return {**self.as_json_norel(), **{
            'invaders': [invader.as_json_norel() for invader in self.invaders]
        }}
    
    def as_json_norel(self):
        """ Returns the User object without relations to other tables (e.g. self.invaders). """
        return {
            'id': self.id,
            'name': self.name,
            'privileges': self.privileges or 0,
            'theme': self.theme,
            'patchnote_seen': 'Yes' if self.patchnote_seen else 'No'
        }

    def __repr__(self) -> str:
        return f'User(name: {self.name})'
    

def action_as_text(a: int) -> str:
    match a:
        case 1: 
            return "{invader} ajouté par {user}."
        case 2: 
            return "{old_invader} renommé en {new_invader} par {user}."
        case 3: 
            return "{invader} : {old_status} devient {new_status} (d'après {user})."
        case 4: 
            return "Nouveau commentaire sur {invader} par {user}."
        case 5:
            return "{invader} déplacé par {user}."
        case _:
            return f"Unknown log (status {a})."

class Action(db.Model):
    __tablename__ = 'actions'

    id: int = db.Column(db.Integer, primary_key = True)
    type: int = db.Column(db.Integer, nullable = False)
        # 1 -> Invader added
        # 2 -> City/id changed
        # 3 -> Status changed
        # 4 -> Comment added
        # 5 -> Invader moved

    old_data: str = db.Column(db.Text)
    new_data: str = db.Column(db.Text)

    date: datetime = db.Column(db.DateTime, default = datetime.now, nullable = False)

    user_name = db.Column(db.String(20), nullable = False) # Used in case the user doesn't exist anymore.

    # FOREIGN KEYS
    user_id = db.Column(db.Integer, db.ForeignKey('users.id')) 

    invader_id = db.Column(db.Integer, db.ForeignKey('invaders.id'), nullable = False) 
    
    def as_json(self):
        return {
            'id': self.id,
            'type': self.type,
            'new_data': self.new_data,
            'old_data': self.old_data,
            'date': self.date,
            'user': self.user.as_json_norel() if self.user else None,
            'user_name': self.user_name,
            'invader': self.invader.as_json_norel()
        }

    def __repr__(self) -> str:
        return f'Action(by: {self.user_name}, for: {self.invader.get_full_id()}, type: {self.type})'
    
# EVENTS 
    
from sqlalchemy import event

@event.listens_for(User, "after_update")
def update_actions_username(mapper, connection, target):
    state = db.inspect(target)
    history = state.attrs.name.history

    if history.has_changes():
        connection.execute(
            Action.__table__.update().where(Action.user_id == target.id).values(user_name = target.name)
        )