from flask_login import current_user

from . import db
from .models import Invader, Action

from typing import List, Union, Literal
from datetime import datetime
import math

class MapData:

    def __init__(self) -> None:
        pass
    
    def all(self) -> List[dict]:
        return {
            'invaders': [invader.as_json() for invader in Invader.query]
        }
    
    def claim_invader(self, lat: float, lng: float) -> dict:
        if current_user.is_authenticated and (invader := Invader.query.filter(
            (Invader.lat == lat) & (Invader.lng == lng)
        ).first()):
            if current_user in invader.users:
                invader.users.remove(current_user)
                claimed = False
            else:
                invader.users.append(current_user)
                claimed = True
            db.session.commit()
            return claimed
        return None
    
    def invader_change_state(self, lat: float, lng: float, state: Literal[0, 1, 2]) -> dict:
        if current_user.is_authenticated and (invader := Invader.query.filter(
            (Invader.lat == lat) & (Invader.lng == lng)
        ).first()):
            action = Action(
                type = 3,
                user_name = current_user.name, # ensures to keep the username in case the user is deleted (which implies user_id being None).
                user_id = current_user.id,
                invader_id = invader.id,
                old_data = invader.state,
                new_data = state
            )
            db.session.add(action)
            db.session.commit()

            invader.state = state
            db.session.commit()
        return None

    def add_invader(self, lat: float, lng: float, city: str, inv_id: int) -> dict:
        new_invader = Invader(
            lat = lat,
            lng = lng,
            city = city,
            inv_id = inv_id
        )
        db.session.add(new_invader)
        db.session.commit()

        action = Action(
            type = 1,
            user_name = current_user.name, # ensures to keep the username in case the user is deleted (which implies user_id being None).
            user_id = current_user.id,
            invader_id = new_invader.id,
            new_data = f'{city}_{inv_id}' if city and inv_id != None else f'NN (#{new_invader.id})'
        )
        db.session.add(action)
        
        current_user.invaders.append(new_invader)
        db.session.commit()

        return new_invader.as_json()

    def move_invader(self, lat: float, lng: float, new_lat: float, new_lng: float) -> dict:
        invader: Invader = Invader.query.filter_by(lat = lat, lng = lng).first()
        action = Action(
            type = 5,
            user_name = current_user.name, # ensures to keep the username in case the user is deleted (which implies user_id being None).
            user_id = current_user.id,
            invader_id = invader.id,
            old_data = f"{invader.lat};{invader.lng}", # formated for map web url.
            new_data = f"{lat};{lng}" 
        )
        db.session.add(action)
        db.session.commit()

        invader.lat = new_lat
        invader.lng = new_lng

        db.session.commit()
        return invader.as_json()    

    def update_invader(self, lat: float, lng: float, city: str, inv_id: int) -> dict:
        invader = Invader.query.filter_by(lat = lat, lng = lng).first()

        action = Action(
            type = 2,
            user_name = current_user.name, # ensures to keep the username in case the user is deleted (which implies user_id being None).
            user_id = current_user.id,
            invader_id = invader.id,
            old_data = f"{invader.city}_{invader.inv_id}" if invader.inv_id != None and invader.city else "NN",
            new_data = f"{city}_{inv_id}" if inv_id != None and city else f'NN (#{invader.id})',
        )

        db.session.add(action)
        db.session.commit()

        invader.city = city
        invader.inv_id = inv_id

        db.session.commit()
        return invader.as_json()
    
    def update_invader_comment(self, lat: float, lng: float, comment: str | None) -> dict:
        invader = Invader.query.filter_by(lat = lat, lng = lng).first()
        action = Action(
            type = 4,
            user_name = current_user.name, # ensures to keep the username in case the user is deleted (which implies user_id being None).
            user_id = current_user.id,
            invader_id = invader.id,
            old_data = invader.comment,
            new_data = comment
        )
        db.session.add(action)
        db.session.commit()

        invader.comment = comment

        db.session.commit()
        return invader.as_json()

    def delete_invader(self, lat: float, lng: float) -> Union[dict, None]:
        if invader := Invader.query.filter(
            (Invader.lat == lat) & (Invader.lng == lng)
        ).first():

            db.session.delete(invader)
            db.session.commit()
            return invader.as_json()
        return None

def get_formated_deltatime(iso_datetime: str) -> str:
    date = datetime.fromisoformat(iso_datetime)
    now = datetime.now()

    deltatime = (now - date).total_seconds()
    deltatime_min = math.floor(deltatime / 60)
    deltatime_hours = math.floor(deltatime / (60 * 60))
    deltatime_days = math.floor(deltatime / (60 * 60 * 24))

    if deltatime_days > 0:
        return f'Ajouté il y a {deltatime_days} jour(s).'
    elif deltatime_hours > 0:
        return f'Ajouté il y a {deltatime_hours} heure(s).'
    elif deltatime_min > 0:
        return f'Ajouté il y a {deltatime_min} minute(s).'
    return 'Ajouté il y a quelques secondes.'