from flask_login import current_user

from . import db
from .models import Invader, User

from typing import List, Union
from datetime import datetime
import math

class MapData:

    def __init__(self) -> None:
        pass
    
    def all(self) -> List[dict]:
        return {
            'invaders': [invader.as_json() for invader in Invader.query]
        }
    
    def add_invader(self, lat: float, lng: float) -> dict:
        new_invader = Invader(
            lat = lat,
            lng = lng
        )
        db.session.add(new_invader)
        
        current_user.invaders.append(new_invader)

        db.session.commit()
        return new_invader.as_json()

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