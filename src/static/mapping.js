class VaderAPI {
    constructor() {
        this.base = '/api/'
    }

    async _get(endpoint) {
        return (await fetch(endpoint, {
            method: 'GET'
        })).json();
    }

    async _get(endpoint, payload) {
        return (await fetch(endpoint + '/?' + (new URLSearchParams(payload)).toString(), 
            {
            method: 'GET'
        })).json();
    }

    async _post(endpoint, payload) {
        return (await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })).json();
    }

    async getCurrentUser() {
        return await this._get(this.base + 'current-user');
    }

    async getMapData() {
        return await this._get(this.base + 'map');
    }

    async claimInvader(lat, lng) {
        return await this._post(
            this.base + 'claim-invader',
            {
                lat: lat,
                lng: lng
            }
        )
    }

    async getUser(name) {
        return await this._get(
            this.base + 'get-user',
            {
                user: name
            }
        )
    }

    async addInvader(lat, lng) {
        await this._post(
            this.base + 'add-invader',
            { 
                lat: lat, 
                lng: lng 
            }
        )
    }

    async deleteInvader(marker) {
        const latLng = marker.getLatLng();
        await this._post(
            this.base + 'delete-invader',
            {
                lat: latLng.lat,
                lng: latLng.lng
            }
        )
    }
}

class VaderMap {
    constructor(mapElementId, mapOrigin = [48.85895522569794, 2.3454093933105473], mapZoom = 12, maxZoom = 18) {
        this.mapId = mapElementId;
        this.mapOrigin = mapOrigin;
        this.mapZoom = mapZoom;
        this.maxZoom = maxZoom;
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
            invader: IMG_PATH + 'invader-logo-white.png',
            otherInvader: IMG_PATH + 'invader-logo.png'
        }

        this.pointer = L.icon({
            iconUrl: this.icons.pointer,
            iconSize: [100, 100]
        });

        this.invaderIcon = L.icon({
            iconUrl: this.icons.invader,
            iconSize: [40, 40]
        });

        this.otherInvaderIcon = L.icon({
            iconUrl: this.icons.otherInvader,
            iconSize: [40, 40]
        });

        this.data = null;
    }

    async init(fitBounds = true) {
        await this.reloadData();
        this.currentUser = (await this.api.getCurrentUser()).current_user;

        let bounds = new L.LatLngBounds(new L.LatLng(-90, -180), new L.LatLng(90, 180))

        this.map = L.map(this.mapId, {
            maxBounds: bounds,
            maxBoundsViscosity: 0.75
        }).setView(
            this.mapOrigin, 
            this.mapZoom
        );
        this.map.zoomControl.remove();
        this.map.options.maxZoom = this.maxZoom;

        this._initClusters();
        this._initGeoLoc(fitBounds);

        if(this.data) {
            this.data.invaders.forEach(async invader => {
                await this.addInvaderMarker(invader.lat, invader.lng);
            });
        }

        /* let gl = L.maplibreGL({
            style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
            attribution: '',
            maxZoom: 22
        }).addTo(this.map); */

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', 
            // attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        ).addTo(this.map);


        const mapClick = (e) => {
            if(confirm(`Confirmer l'ajout de SI n°${this.data.invaders.length + 1} ?`)) {
                let latLng = e.latlng;
                this.addInvader(latLng.lat, latLng.lng);
            }
        }

        this.map.on('click', mapClick);
    }

    _initClusters() {
        this.markerClusterGroup = L.markerClusterGroup({
            disableClusteringAtZoom: 18,
            iconCreateFunction: (cluster) => {
                let dark = cluster.getAllChildMarkers().some(marker => {
                    return marker.getIcon() === this.otherInvaderIcon
                });
                const count = cluster.getChildCount();
                let fontSize = 14;
                if(count > 99) {
                    fontSize = 12;
                } else if(count > 999) {
                    fontSize = 10;
                }
                return L.divIcon({ 
                    html: `
                        <b style="font-size: ${fontSize}px;">${count}</b>
                    `,
                    className: dark ? 'cluster-icon dark' : 'cluster-icon',
                    iconSize: [30, 30]
                });
            }
        });
        this.map.addLayer(this.markerClusterGroup);
    }
      
    addMarkerToCluster(marker) {
        this.markerClusterGroup.addLayer(marker);
    }
    
    clearClusters() {
        this.markerClusterGroup.clearLayers();
    }

    _initGeoLoc(fitBounds = true) {
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
            this.currentPos.marker.setZIndexOffset(-100);
            this.currentPos.accCircle = L.circle([lat, lng], { radius: accuracy }).addTo(this.map);

            if(!this.currentPos.zoomed && fitBounds) {
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

    async addInvader(lat, lng) {
        await this.api.addInvader(lat, lng);
        await this.reloadData();
        await this.addInvaderMarker(lat, lng);
    }

    async deleteInvader(marker) {
        this.markerClusterGroup.removeLayer(marker);
        this.activeMarkers.splice(this.activeMarkers.indexOf(marker), 1);
        await this.api.deleteInvader(marker);
        await this.reloadData();
    }

    hasInvader(user, invader) {
        if(invader.users.map(obj => obj.id).includes(user.id)) {
            return true;
        }
        return false;
    }

    getInvaderData(lat, lng) {
        return this.data.invaders.filter(invader => 
            (invader.lat === lat && invader.lng === lng)
        )[0];
    }

    async addInvaderMarker(lat, lng) {
        const invader = this.getInvaderData(lat, lng);
        let icon = this.otherInvaderIcon;
        const isInvaderOwner = invader.users.length > 0 ? this.currentUser.id === invader.users[0].id : true;
        const hasInvader = this.hasInvader(this.currentUser, invader);
        if(hasInvader) {
            icon = this.invaderIcon;
        }
        let spaceInvMarker = L.marker([lat, lng], { icon: icon });
        this.addMarkerToCluster(spaceInvMarker);

        const formatedUsers = invader.users.map(user => `<li>${user.name}</li>`).join('');
        const date = new Date(invader.date);
        date.setHours(date.getHours() + 2);
        let invaderContainer = document.createElement('div');
        invaderContainer.classList.add('invader-marker');
        invaderContainer.innerHTML = `
            <p class="invader-name">n°${this.data.invaders.indexOf(invader) + 1} <span style="color: gray; font-size: 10px;">(#${invader.id})</span></p>
            <p>Trouvé par :</p>
            <ul>
                ${formatedUsers}
            </ul>
            <small>${date.toLocaleString()}</small>
        `;

        let btns = document.createElement('div');

        if(isInvaderOwner || this.currentUser.privileges >= 1) {
            let deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<strong>Supprimer</strong>';
            deleteBtn.style.background = 'transparent';
            deleteBtn.style.border = 'none';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.onclick = () => { this.deleteInvader(spaceInvMarker); };
            btns.appendChild(deleteBtn);
        }
        
        let claimBtn = document.createElement('button');
        claimBtn.innerHTML = hasInvader ? '<strong>Ne plus marquer</strong>' : '<strong>Marquer</strong>';
        claimBtn.style.background = 'transparent';
        claimBtn.style.border = 'none';
        claimBtn.style.cursor = 'pointer';
        claimBtn.onclick = async () => { await this.updateClaimState(lat, lng, spaceInvMarker); };
        btns.appendChild(claimBtn);

        invaderContainer.appendChild(btns);
        spaceInvMarker.bindPopup(invaderContainer);
        this.activeMarkers.push(spaceInvMarker);
    }

    async updateClaimState(lat, lng, marker) {
        const claimed = await this.api.claimInvader(lat, lng);
        await this.reloadData();
        this.markerClusterGroup.removeLayer(marker);
        await this.addInvaderMarker(lat, lng);
    }

    async reloadData() {
        this.data = await this.api.getMapData();
    }

    async getNominatimInfos(lat, lng) {
        const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;

        try {
            return (await fetch(nominatimUrl)).json();
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