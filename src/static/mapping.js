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
        return (await fetch(endpoint + '/?' + (new URLSearchParams(payload)).toString(), {
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

    async getInvaderImage(city, inv_id) {
        return await this._get(
            this.base + 'get-invader-image',
            {
                city: city,
                inv_id: inv_id
            }
        )
    }

    async getCities() {
        return await this._get(this.base + 'get-cities')
    }

    async doesNotExist(lat, lng, state) {
        return await this._post(
            this.base + 'invader-does-not-exist',
            {
                lat: lat,
                lng: lng,
                state: state
            }
        )
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

    async addInvader(lat, lng, city, inv_id) {
        await this._post(
            this.base + 'add-invader',
            { 
                lat: lat, 
                lng: lng,
                city: city,
                inv_id: inv_id
            }
        )
    }

    async updateInvader(lat, lng, city, inv_id) {
        await this._post(
            this.base + 'update-invader',
            { 
                lat: lat, 
                lng: lng,
                city: city,
                inv_id: inv_id
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

const iOS = () => { // Returns true if the platform is iOS
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

class VaderMap {
    constructor(mapElementId, mapOrigin = [48.85895522569794, 2.3454093933105473], mapZoom = 12, maxZoom = 18) {

        if(iOS()) {
            this.iconSize = [30, 30];
            this.pointerSize = [80, 80];
        } else {
            this.iconSize = [40, 40];
            this.pointerSize = [100, 100];
        }

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
            otherInvader: IMG_PATH + 'invader-logo.png',
            brokenInvader: IMG_PATH + 'invader-logo-broken.png',
            brokenInvaderWhite: IMG_PATH + 'invader-logo-white-broken.png',
            inexistentInvader: IMG_PATH + 'invader-logo-inexistent.png',
            inexistentInvaderWhite: IMG_PATH + 'invader-logo-white-inexistent.png',
            damagedInvader: IMG_PATH + 'invader-logo-damaged.png',
            damagedInvaderWhite: IMG_PATH + 'invader-logo-white-damaged.png',
            redInvaderDebug: IMG_PATH + 'invader-logo-red.png'
        }

        this.pointer = L.icon({
            iconUrl: this.icons.pointer,
            iconSize: this.pointerSize
        });

        this.invaderIcon = L.icon({
            iconUrl: this.icons.invader,
            iconSize: this.iconSize
        });

        this.otherInvaderIcon = L.icon({
            iconUrl: this.icons.otherInvader,
            iconSize: this.iconSize
        });

        this.brokenInvaderIcon = L.icon({
            iconUrl: this.icons.brokenInvader,
            iconSize: this.iconSize
        })

        this.brokenInvaderWhiteIcon = L.icon({
            iconUrl: this.icons.brokenInvaderWhite,
            iconSize: this.iconSize
        })

        this.inexistentInvaderIcon = L.icon({
            iconUrl: this.icons.inexistentInvader,
            iconSize: this.iconSize
        })

        this.inexistentInvaderWhiteIcon = L.icon({
            iconUrl: this.icons.inexistentInvaderWhite,
            iconSize: this.iconSize
        })

        this.damagedInvaderIcon = L.icon({
            iconUrl: this.icons.damagedInvader,
            iconSize: this.iconSize
        })

        this.damagedInvaderWhiteIcon = L.icon({
            iconUrl: this.icons.damagedInvaderWhite,
            iconSize: this.iconSize
        })

        this.redInvaderDebugIcon = L.icon({
            iconUrl: this.icons.redInvaderDebug,
            iconSize: this.iconSize
        })

        this.data = null;
    }

    async init(fitBounds = true) {
        await this.reloadData();
        this.currentUser = (await this.api.getCurrentUser()).current_user;

        this.cities = (await this.api.getCities()).cities;

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

            /* 
            --------- USE THE CODE BELLOW IF YOU HAVE REPLACEMENT DATA --------- 
            Replacement data is a file that contains informations about invaders which coordinates are to be changed in the following format :
            [
                ...,
                {
                    "city": "PA", # The city code of the invader
                    "id": 122, # The id
                    "current_coords": [ # The coordinates currently in your database
                        ..., # lat
                        ...  # lng
                    ],
                    "new_coords": [ # The coordinates that it will be changed to
                        ...,
                        ...
                    ]
                },
                ...
            ]
            --------------------------------------------------------------------
            */

            /*
            let replacementsData = (await fetch('./replacements.json')).json()
            (await replacementsData).replacements.forEach(replacement => {
                L.polyline(
                    [replacement.current_coords, replacement.new_coords], 
                    {color: 'black'}
                ).addTo(this.map);

                L.circle(replacement.current_coords, { radius: 0.00015 }).addTo(this.map);

                let newInvader = replacement.new_coords;
                let spaceInvMarker = L.marker(newInvader, { icon: this.redInvaderDebugIcon });
                this.addMarkerToCluster(spaceInvMarker);
                this.activeMarkers.push(spaceInvMarker);
            }) 
            */
        }

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', 
            /* { attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors' } */
        ).addTo(this.map);

        const mapClick = async e => {
            
            let optionsString = '';
            Object.keys(this.cities).forEach(cityCode => {
                let selected = cityCode == 'PA' ? 'selected' : '';
                optionsString += `<option value="${cityCode}" ${selected}>${cityCode}</option>`
            })

            let validate = await this.confirmationModal(
                `
                    <strong>Ajouter l'invader n°${this.data.invaders.length + 1} ?</strong>
                    <p>Si possible, donnez son identifiant (voir application flashInvaders&copy;) :</p>
                    <div class="inputs">
                        <select id="invader-city">${optionsString}</select>
                        <input id="invader-id" type="number">
                    </div>
                    <small>Cela permet d'ajouter automatiquement une image</small>
                `, 
                ['invader-city', 'invader-id']
            )

            if(validate) {
                let latLng = e.latlng;

                let rawInvId = validate['invader-id'];
                let rawCity = validate['invader-city'];
                let inv_id = rawInvId ? Number(rawInvId) : null;
                let city = inv_id ? rawCity : null; // Not null only if inv_id is valid.

                const maxId = this.cities[rawCity].invaders;
                const cityName = this.cities[rawCity].name;
                if(inv_id > maxId || inv_id < 0) {
                    alert(`Cet identifiant est supérieur à l\'identifiant maximal pour cette région (${maxId} à ${cityName}) ou inférieur à 1.`)
                } else {
                    this.addInvader(latLng.lat, latLng.lng, city, inv_id);
                }
            }
        }

        const updateLatLngText = (e) => {
            const latEl = document.getElementById('lat-value');
            const lngEl = document.getElementById('lng-value');

            const latLng = e.latlng;

            if(latEl && lngEl) {
                latEl.innerHTML = latLng.lat;
                lngEl.innerHTML = latLng.lng;
            }
        }

        const loadInvaderImage = async (e) => {
            const invaderMarker = e.popup._source;
            const latLng = invaderMarker.getLatLng();
            const invader = this.getInvaderData(latLng.lat, latLng.lng);

            if (invader && invader.city && invader.inv_id) {
                const invaderImage = (await this.api.getInvaderImage(invader.city, invader.inv_id)).img;
                const popUpElement = invaderMarker.getPopup().getContent();
                popUpElement.querySelector('.invader-img').setAttribute('src', invaderImage);
                invaderMarker.setPopupContent(popUpElement);
            }
        }

        this.map.on('click', mapClick);
        this.map.on('mousemove', updateLatLngText)
        this.map.on('popupopen', loadInvaderImage)
    }

    confirmationModal(htmlContent, inputIdsToCheck) {
        // Shows a Modal with html content 'htmlContent' and that executes function 'f' on success.

        const modal = document.getElementById('modal');
        const modalBlur = document.getElementById('modal-blur');

        modal.innerHTML = htmlContent;
        modal.classList.add('visible');
        modalBlur.classList.add('visible');

        /* CSS properties */
        const changeSize = () => {
            modal.style.left = `${window.innerWidth / 2 - modal.clientWidth / 2 - 20}px`;
            modal.style.top = `${window.innerHeight / 2 - modal.clientHeight / 2 - 20}px`;
        }
        changeSize();
        window.onresize = () => {
            changeSize();
        }
        
        /* Validate & Cancel buttons */
        const btns = document.createElement('div');
        btns.classList.add('btns');

        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<strong>Annuler</strong>';
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.children[0].style.color = 'red';

        const validateBtn = document.createElement('button');
        validateBtn.innerHTML = '<strong>Valider</strong>';
        validateBtn.style.background = 'transparent';
        validateBtn.style.border = 'none';
        validateBtn.style.cursor = 'pointer';
        validateBtn.children[0].style.color = '#0f4ca8';
        
        btns.appendChild(validateBtn);
        btns.appendChild(cancelBtn);
        
        modal.appendChild(btns);

        let closeModal = () => {
            modal.innerHTML = '';
            modal.classList.remove('visible');
            modalBlur.classList.remove('visible');
        }

        return new Promise((resolve, _) => {
            cancelBtn.onclick = () => { 
                closeModal();
                resolve(false);
            };
    
            validateBtn.onclick = () => { 
                let inputs = {}
                inputIdsToCheck.forEach(input => {
                    const inputEl = document.getElementById(input);
                    inputs[input] = inputEl.value;
                });

                closeModal();
                resolve(inputs);
            };
        });
    }

    _initClusters() {
        this.markerClusterGroup = L.markerClusterGroup({
            disableClusteringAtZoom: 18, /* 19 to cluster even at maximum zoom (18 otherwise). */
            iconCreateFunction: (cluster) => {
                let dark = cluster.getAllChildMarkers().some(marker => {
                    const latLng = marker.getLatLng();
                    const invader = this.getInvaderData(latLng.lat, latLng.lng);
                    return !this.hasInvader(this.currentUser, invader) && invader.state != 2 && invader.state != 1; // Un invader rend son groupe noir lorsqu'il n'est pas marqué par l'utilisateur ET qu'il n'est pas cassé ou introuvable (puisqu'un invader cassé/introuvable ne peut pas être obtenu).
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

    async addInvader(lat, lng, city, inv_id) {
        await this.api.addInvader(lat, lng, city, inv_id);
        await this.reloadData();
        await this.addInvaderMarker(lat, lng);
    }

    async deleteInvader(marker) {
        if (confirm(`Confirmer la suppression ?`)) {
            this.markerClusterGroup.removeLayer(marker);
            this.activeMarkers.splice(this.activeMarkers.indexOf(marker), 1);
            await this.api.deleteInvader(marker);
            await this.reloadData();
        }
    }

    async updateInvader(lat, lng, marker) {
        await this.reloadData();
        this.markerClusterGroup.removeLayer(marker);
        await this.addInvaderMarker(lat, lng);
    }

    async updateClaimState(lat, lng, marker) {
        await this.api.claimInvader(lat, lng);
        await this.updateInvader(lat, lng, marker);
    }

    async updateExistence(lat, lng, marker, state) {
        await this.api.doesNotExist(lat, lng, state);
        await this.updateInvader(lat, lng, marker);
    }

    async updateCityId(lat, lng, marker, city, inv_id) {
        await this.api.updateInvader(lat, lng, city, inv_id);
        await this.updateInvader(lat, lng, marker);
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

    getStatusFrom(statusId) {
        if(statusId == 0)
            return 'Bon état'
        else if(statusId == 1)
            return 'Introuvable'
        else if(statusId == 2)
            return 'Détruit'
        else
            return 'Abîmé'
    }

    async addInvaderMarker(lat, lng) {
        const invader = this.getInvaderData(lat, lng);
        let icon = this.otherInvaderIcon;
        const isInvaderOwner = invader.users.length > 0 ? this.currentUser.id === invader.users[0].id : true;
        const hasInvader = this.hasInvader(this.currentUser, invader);
        if(hasInvader) {
            if(invader.state == 1) {
                icon = this.inexistentInvaderWhiteIcon;
            } else if(invader.state == 2) {
                icon = this.brokenInvaderWhiteIcon;
            } else if(invader.state == 3) {
                icon = this.damagedInvaderWhiteIcon;
            } else {
                icon = this.invaderIcon;
            }
        } else {
            if(invader.state == 1) {
                icon = this.inexistentInvaderIcon;
            } else if(invader.state == 2) {
                icon = this.brokenInvaderIcon;
            } else if(invader.state == 3) {
                icon = this.damagedInvaderIcon;
            } else {
                icon = this.otherInvaderIcon;
            }
        }
        let spaceInvMarker = L.marker([lat, lng], { icon: icon });
        this.addMarkerToCluster(spaceInvMarker);

        const formatedUsers = invader.users.map(user => `<li>${user.name}</li>`).join('');
        const date = new Date(invader.date);

        let invaderName = 'Non nommé';

        if (invader.city && invader.inv_id) {
            const city = invader.city;
            const inv_id = invader.inv_id
            invaderName = `${city}_${inv_id}`;
        }

        const invaderNum = this.data.invaders.indexOf(invader) + 1 // This is NOT the invader's ID, just it's number of appearence.

        date.setHours(date.getHours() + 2);
        let invaderContainer = document.createElement('div');
        invaderContainer.classList.add('invader-marker');
        invaderContainer.innerHTML = `
            <img class="invader-img" src=""></img>
            <p>Trouvé par :</p>
            <ul>
                ${formatedUsers}
            </ul>
            <small>${date.toLocaleString()}</small>
            <small>${this.getFormatedDeltaTime(date.toISOString())}</small>
        `;

        let nameChangeBtn = document.createElement('button');
        nameChangeBtn.classList.add('name-change-btn');
        nameChangeBtn.innerHTML = `<strong class="name-change">${invaderName}</strong> <span style="color: gray; font-size: 10px;">(#${invaderNum})</span>`;
        nameChangeBtn.style.background = 'transparent';
        nameChangeBtn.style.border = 'none';
        nameChangeBtn.style.cursor = 'pointer';
        nameChangeBtn.onclick = async () => { 
            let optionsString = '';
            Object.keys(this.cities).forEach(cityCode => {
                let selected = cityCode == invader.city ? 'selected' : 'PA';
                optionsString += `<option value="${cityCode}" ${selected}>${cityCode}</option>`
            });
            let idDefaultValue = invader.inv_id ? invader.inv_id : 0;

            let validate = await this.confirmationModal(
                `
                    <strong>Modifier l'invader ${invader.city}_${invader.inv_id} ?</strong>
                    <div class="inputs">
                        <select id="invader-city">${optionsString}</select>
                        <input id="invader-id" type="number" value="${idDefaultValue}">
                    </div>
                    <small>Spécifier un identifiant permet d'ajouter automatiquement une image.</small>
                `, 
                ['invader-city', 'invader-id']
            )

            if(validate) {
                let rawInvId = validate['invader-id'];
                let rawCity = validate['invader-city'];
                let inv_id = rawInvId ? Number(rawInvId) : null;
                let city = inv_id ? rawCity : null; // Not null only if inv_id is valid.

                const maxId = this.cities[rawCity].invaders;
                const cityName = this.cities[rawCity].name;
                if(inv_id > maxId || inv_id < 0) {
                    alert(`Cet identifiant est supérieur à l\'identifiant maximal pour cette région (${maxId} à ${cityName}) ou inférieur à 1.`)
                } else {
                    this.updateCityId(lat, lng, spaceInvMarker, city, inv_id);
                }
            }
        };

        invaderContainer.insertBefore(nameChangeBtn, invaderContainer.firstChild);

        // ----- Upper Buttons ----- //

        let upperBtns = document.createElement('div');

        if(isInvaderOwner || this.currentUser.privileges >= 1) {
            let deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<strong>Supprimer</strong>';
            deleteBtn.style.background = 'transparent';
            deleteBtn.style.border = 'none';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.onclick = () => { this.deleteInvader(spaceInvMarker); };
            upperBtns.appendChild(deleteBtn);
        }
        
        let claimBtn = document.createElement('button');
        claimBtn.innerHTML = hasInvader ? '<strong>Ne plus marquer</strong>' : '<strong>Marquer</strong>';
        claimBtn.style.background = 'transparent';
        claimBtn.style.border = 'none';
        claimBtn.style.cursor = 'pointer';
        claimBtn.onclick = async () => { await this.updateClaimState(lat, lng, spaceInvMarker); };
        upperBtns.appendChild(claimBtn);

        invaderContainer.appendChild(upperBtns);

        // ------------------------- //

        // State Change Button //

        let stateChange = document.createElement('button');
        stateChange.innerHTML = `<small>Etat de l'invader</small>`;
        stateChange.style.background = 'transparent';
        stateChange.style.border = 'none';
        stateChange.style.cursor = 'pointer';
        stateChange.children[0].style.color = 'red';
        stateChange.onclick = async () => { 
            let optionsString = ''
            for (let i = 0; i <= 3; i++) {
                let selected = invader.state == i ? 'selected' : ''
                optionsString += `<option value="${i}" ${selected}>${this.getStatusFrom(i)}</option>`
            }
            let newState = await this.confirmationModal(
                `
                    <strong>Modifier le statut de ${invader.city}_${invader.inv_id}.</strong>
                    <p>Choisissez l'état dans lequel est l'invader :</p>
                    <div class="inputs">
                        <select id="invader-status">${optionsString}</select>
                    </div>
                `, 
                ['invader-status']
            )

            if(newState) {
                let status = Number(newState['invader-status'])
                await this.updateExistence(lat, lng, spaceInvMarker, status); 
            }
        };

        invaderContainer.appendChild(stateChange);

        // ------------------------- //

        if(invader.state == 1 || invader.state == 2) {
            const state = invader.state == 1 ? 'introuvable' : 'détruit';

            let text = document.createElement('small');
            text.innerHTML = `Cet invader a été marqué comme '${state}', a-t-il été `;
            text.style.textAlign = 'center';
            text.style.width = '200px';

            let removeStateBtn = document.createElement('button');
            removeStateBtn.innerHTML = `<small>retrouvé ?</small>`;
            removeStateBtn.style.background = 'transparent';
            removeStateBtn.style.border = 'none';
            removeStateBtn.style.cursor = 'pointer';
            removeStateBtn.children[0].style.color = '#7c59fa';
            removeStateBtn.onclick = async () => { await this.updateExistence(lat, lng, spaceInvMarker, 0); };

            text.appendChild(removeStateBtn);
            invaderContainer.appendChild(text);
        }

        spaceInvMarker.bindPopup(invaderContainer);
        this.activeMarkers.push(spaceInvMarker);
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