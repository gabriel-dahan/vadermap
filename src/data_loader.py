import json
from datetime import datetime

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