class VaderAPI {
    constructor() {
        this.base = '/api/'
    }

    _get(endpoint) {
        return fetch(endpoint, {
            method: 'GET',
        }).then(res => res.json());
    }

    _post(endpoint, payload, callback = (data) => {}) {
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(res => res.json())
          .then(data => callback(data))
          .catch(error => {
            console.error(error);
        });
    }

    getMapData() {
        return this._get(this.base + 'map');
    }

    addInvader(lat, lng) {
        this._post(
            this.base + 'add-invader',
            { 
                lat: lat, 
                lng: lng 
            }
        )
    }

    deleteInvader(marker) {
        const latLng = marker.getLatLng();
        this._post(
            this.base + 'delete-invader',
            {
                lat: latLng.lat,
                lng: latLng.lng
            }
        )
    }
}

class VaderMap {
    constructor(mapElementId, mapOrigin = [48.85895522569794, 2.3454093933105473], mapZoom = 13) {
        this.mapId = mapElementId;
        this.mapOrigin = mapOrigin;
        this.mapZoom = mapZoom;
        this.activeMarkers = [];

        this.api = new VaderAPI();
        
        this.currentPos = {
            marker: null,
            accCircle: null,
            zoomed: null
        }

        const IMG_PATH = 'img/';
        this.icons = {
            pointer: IMG_PATH + 'pointer.png',
            invader: IMG_PATH + 'invader-logo-white.png'
        }

        this.pointer = L.icon({
            iconUrl: this.icons.pointer,
            iconSize: [100, 100]
        });

        this.markerIcon = L.icon({
            iconUrl: this.icons.invader,
            iconSize: [40, 40]
        });

        this.data = null;
    }

    init() {
        this.map = L.map(this.mapId).setView(
            this.mapOrigin, 
            this.mapZoom
        );
        this.map.zoomControl.remove();

        this._initGeoLoc();
        this._reloadInvadersList();

        if(this.data) {
            this.data.invaders.forEach(invader => {
                this.addInvaderMarker(invader.lat, invader.lng);
            });
        }

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);


        const mapClick = (e) => {
            let latLng = e.latlng;
            this.addInvader(latLng.lat, latLng.lng);
        }

        this.map.on('click', mapClick);
    }

    _reloadInvadersList() {
        const listElement = document.getElementById('invaders-list');
        listElement.innerHTML = '';
        this.data.invaders.forEach(invader => {
            listElement.innerHTML += 
                `
                    <li onclick="vaderMap.centerToInvader(${invader.lat}, ${invader.lng})" data-lat=${invader.lat} data-lng=${invader.lng}>
                        <details>
                            <summary>${this.getFormatedDeltaTime(invader.date)}</summary>
                            <p>Lat: ${invader.lat}</p>
                            <p>Lng: ${invader.lng}</p>
                        </details>
                    </li>
                `;
        });
    }

    _initGeoLoc() {
        const geolocDenied = (err) => {
            if (err.code === 1) {
                console.error('Géolocalisation non acceptée.');
            } else {
                console.error(err);
            }
        }

        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;

            if(this.currentPos.marker && this.currentPos.accCircle) {
                this.currentPos.marker.remove();
                this.currentPos.accCircle.remove();
            }
            this.currentPos.marker = L.marker([lat, lng], { icon: this.pointer }).addTo(this.map);
            this.currentPos.accCircle = L.circle([lat, lng], { radius: accuracy }).addTo(this.map);

            if(!this.currentPos.zoomed) {
                this.currentPos.zoomed = this.map.fitBounds(this.currentPos.accCircle.getBounds());
            }
        }, geolocDenied);
    }

    getInvaderMarker(lat, lng) {
        /* Returns a Marker object if found, null otherwise. */
        let invMarker = null;
        this.activeMarkers.forEach(marker => {
            const latLng = marker.getLatLng();
            if(latLng.lat === lat && latLng.lng === lng) {
                invMarker = marker;
            }
        });
        return invMarker;
    }

    centerToInvader(lat, lng) {
        const invader = this.getInvaderMarker(lat, lng);
        if(invader) {
            this.map.setView(invader.getLatLng(), 19);
            invader.openPopup();
        }
    }

    addInvader(lat, lng) {
        this.addInvaderMarker(lat, lng);
        this.api.addInvader(lat, lng);
        this.data.invaders.push({
            lat: lat,
            lng: lng,
            date: new Date()
        });
        this._reloadInvadersList();
    }

    deleteInvader(marker) {
        const latLng = marker.getLatLng();
        marker.remove();
        this.activeMarkers.splice(this.activeMarkers.indexOf(marker), 1);
        this.api.deleteInvader(marker);
        this.data.invaders = this.data.invaders.filter(invader => {
            return invader.lat !== latLng.lat && invader.lng !== latLng.lng;
        });
        this._reloadInvadersList();
    }

    addInvaderMarker(lat, lng) {
        let spaceInvMarker = L.marker([lat, lng], { icon: this.markerIcon }).addTo(this.map);
        let deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<strong>Supprimer</strong>';
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = () => { this.deleteInvader(spaceInvMarker); };
        spaceInvMarker.bindPopup(deleteBtn);
        this.activeMarkers.push(spaceInvMarker);
    }

    loadData(data) {
        this.data = data;
    }

    getNominatimInfos(lat, lng) {
        const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;

        try {
            return fetch(nominatimUrl);
        } catch(err) {
            console.error(err);
        }
    }

    getFormatedDeltaTime(isoDateTime) {
        const date = new Date(isoDateTime);
        const now = new Date();

        const deltaTimeMilli = now.getTime() - date.getTime();
        // const deltaTimeSec = Math.floor(deltaTimeMilli / 1000);
        const deltaTimeMin = Math.floor(deltaTimeMilli / (1000 * 60));
        const deltaTimeHours = Math.floor(deltaTimeMilli / (1000 * 60 * 60));
        const deltaTimeDays = Math.floor(deltaTimeMilli / (1000 * 60 * 60 * 24));

        if(deltaTimeDays > 0) {
            return `Ajouté il y a ${deltaTimeDays} jour(s).`
        } else if(deltaTimeHours > 0) {
            return `Ajouté il y a ${deltaTimeHours} heure(s).`
        } else if(deltaTimeMin > 0) {
            return `Ajouté il y a ${deltaTimeMin} minute(s).`
        } else {
            return 'Ajouté il y a quelques secondes.'
        }
    }
}