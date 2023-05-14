import json
from datetime import datetime
import math

class MapData:

    def __init__(self) -> None:
        with open('src/instance/data.json', 'r') as fp:
            self.data = json.load(fp)
    
    def all(self) -> dict:
        return self.data
    
    def add_invader(self, lat: float, lng: float) -> None:
        self.data['invaders'].append({
            'lat': lat, 
            'lng': lng,
            'date': datetime.now().isoformat()
        })
        with open('src/instance/data.json', 'w') as fp:
            json.dump(self.data, fp, indent = 4)

    def delete_invader(self, lat: float, lng: float) -> None:
        for i, invader in enumerate(self.data['invaders']):
            if invader['lat'] == lat and invader['lng'] == lng:
                self.data['invaders'].pop(i)
                with open('src/instance/data.json', 'w') as fp:
                    json.dump(self.data, fp, indent = 4)

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