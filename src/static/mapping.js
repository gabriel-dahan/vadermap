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

    async changeState(lat, lng, state) {
        return await this._post(
            this.base + 'invader-change-state',
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

    async moveInvader(lat, lng, newLat, newLng) {
        await this._post(
            this.base + 'move-invader',
            {
                lat: lat,
                lng: lng,
                new_lat: newLat,
                new_lng: newLng
            }
        )
    }

    async updateInvaderComment(lat, lng, comment) {
        await this._post(
            this.base + 'update-invader-comment',
            {
                lat: lat,
                lng: lng,
                comment: comment
            }
        )
    }

    async deleteInvader(lat, lng) {
        await this._post(
            this.base + 'delete-invader',
            {
                lat: lat,
                lng: lng
            }
        )
    }
}

class VaderWS {
    constructor() {

        this.socket = io();
        this.initEvents();
    }

    initEvents() {
        this.socket.on('response', data => {
            console.log(data.message);
        });

        this.socket.on('connect', () => {
            console.log('Connected to map.');
            this.socket.send('Hello Server from /map!');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from the map.');
        });

        this.socket.on('broadcast', data => {
            this.__handleBroadcastEvent(data);
        });
    }

    getConn() {
        return this.socket
    }

    __handleBroadcastEvent(data) {
        switch (data.event) {
            case 'add_invader':
                this.vaderMap.addInvaderMarker();
                break;
            case 'delete_invader':
                this.vaderMap.deleteInvaderMarker();
                break;
            default:
                break;
        }
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

class VaderUtilities {
    constructor() {  }

    getInformationModalBase(depth) {
        // depth > 0 for nested modals

        if (depth < 0) {
            alert('Wrong modal depth.')
            return ''
        }

        const footer = this.getInformationModalFooter(depth);

        return `
        <div class="modal fade" id="modal${depth}" tabindex="-1" aria-labelledby="modal-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="modal${depth}-title"></h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modal${depth}-body"></div>
                    <div class="modal-footer" id="modal${depth}-footer">
                        ${footer}
                    </div>
                </div>
            </div>
        </div>
        `
    }

    getConfirmationModalBase(depth) {
        if (depth < 0) {
            alert('Wrong nested modal depth.')
            return ''
        }

        const footer = this.getConfirmationModalFooter(depth);

        return `
        <div class="modal fade" id="modal${depth}" tabindex="-1" aria-labelledby="modal-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="modal${depth}-title"></h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modal${depth}-body"></div>
                    <div class="modal-footer" id="modal${depth}-footer">
                        ${footer}
                    </div>
                </div>
            </div>
        </div>
        `
    }

    getInformationModalFooter(depth) {
        if(depth > 0) {
            return `<button type="button" class="btn btn-secondary" data-bs-target="#modal${depth - 1}" data-bs-toggle="modal">Retour</button>`
        } else {
            return '<button type="button" class="btn btn-secondary" data-bs-target="#modal0" data-bs-dismiss="modal">Fermer</button>'
        }
    }

    getConfirmationModalFooter(depth, nestedDismiss) {
        if(depth > 0) {
            let dataAttr = `data-bs-target="#modal${depth - 1}" data-bs-toggle="modal"`;
            if(nestedDismiss) {
                dataAttr = `data-bs-dismiss="modal"`;
            } 

            return `<button type="button" class="btn btn-secondary" data-bs-target="#modal${depth - 1}" data-bs-toggle="modal">Retour</button>
            <button type="button" class="btn btn-primary" id="modal${depth}-validate" ${dataAttr}>Valider</button>`

        } else {
            return `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-primary" id="modal0-validate">Valider</button>`
        }
    }

    informationModal(title, htmlElement, width = -1, height = -1, nested = 0) {
        let modalSpecialId = `modal${nested}`

        let modalBase = this.getInformationModalBase(nested);

        let modal = document.getElementById(modalSpecialId);

        if(!modal) {
            document.body.insertAdjacentHTML('afterbegin', modalBase);
            modal = document.getElementById(modalSpecialId);
        }

        const modalDialog = modal.children[0];
        const modalTitle = document.getElementById(`${modalSpecialId}-title`);
        const modalBody = document.getElementById(`${modalSpecialId}-body`);
        const modalFooter = document.getElementById(`${modalSpecialId}-footer`);

        modalTitle.innerHTML = title;
        modalBody.replaceChildren(htmlElement);

        const footer = this.getInformationModalFooter(nested);
        modalFooter.innerHTML = footer;

        if (width !== -1) {
            modalDialog.style.setProperty('max-width', width, 'important');
        } else {
            modalDialog.style.maxWidth = '';
        }

        if (height !== -1) {
            modalDialog.style.setProperty('max-height', height, 'important');
        } else {
            modalDialog.style.maxHeight = '';
        }

        // Enable TOOLTIPS inside modal :
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => { 
            new bootstrap.Tooltip(tooltipTriggerEl) ;
        });

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            modalDialog.style.maxWidth = '';
            modalDialog.style.maxHeight = '';
        });
    }

    async confirmationModal(title, htmlElement, inputIdsToCheck, width = -1, height = -1, nested = 0, nestedDismiss = false) {
        let modalSpecialId = `modal${nested}`

        let modalBase = this.getConfirmationModalBase(nested);

        let modal = document.getElementById(modalSpecialId);

        if(!modal) {
            document.body.insertAdjacentHTML('afterbegin', modalBase);
            modal = document.getElementById(modalSpecialId);
        }

        const modalDialog = modal.children[0];
        const modalTitle = document.getElementById(`${modalSpecialId}-title`);
        const modalBody = document.getElementById(`${modalSpecialId}-body`);
        const modalFooter = document.getElementById(`${modalSpecialId}-footer`);
        
        modalTitle.innerHTML = title
        modalBody.replaceChildren(htmlElement);
        
        const footer = this.getConfirmationModalFooter(nested, nestedDismiss);
        modalFooter.innerHTML = footer;

        if (width !== -1) {
            modalDialog.style.setProperty('max-width', width, 'important');
        } else {
            modalDialog.style.maxWidth = '';
        }

        if (height !== -1) {
            modalDialog.style.setProperty('max-height', height, 'important');
        } else {
            modalDialog.style.maxHeight = '';
        }

        // Enable TOOLTIPS inside modal :
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltips = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        let options = {}
        if(nested > 0) {
            options = {
                backdrop: false
            }
        }

        const bootstrapModal = new bootstrap.Modal(modal, options);
        bootstrapModal.show();

        return new Promise((resolve, _) => {
            let validateClicked = false;
            let inputs = {}

            const modalValidateBtn = document.getElementById(`${modalSpecialId}-validate`);

            modalValidateBtn.onclick = () => { 
                inputIdsToCheck.forEach(input => {
                    const inputEl = document.getElementById(input);
                    inputs[input] = inputEl.value;
                });

                validateClicked = true;
                if(nested === 0) {
                    bootstrapModal.hide();
                }
            };

            modal.addEventListener('hidden.bs.modal', () => {
                if(validateClicked) {
                    resolve(inputs);
                } else {
                    resolve(false);
                }

                modalDialog.style.maxWidth = '';
                modalDialog.style.maxHeight = '';
            });
        });
    }

    getFormatedInvaderName(invader) {
        // Formats invaderObject into CITY_ID format.

        let invaderName = 'Non nommé';

        if (invader.city && invader.inv_id != null) {
            const city = invader.city;
            const inv_id = invader.inv_id
            invaderName = `${city}_${inv_id}`;
        }

        return invaderName;
    }

    getFormatedState(state) {
        if(state == 1) {
            return '<span class="text-secondary-emphasis">introuvable</span>'
        } else if(state == 2) {
            return '<span class="text-danger-emphasis">détruit</span>'
        } else if(state == 0)  {
            return '<span class="text-success-emphasis">bon état</span>'
        } else if(state == 3)  {
            return '<span class="text-warning-emphasis">abîmé</span>'
        }
    }

    getFormatedDeltaTime(isoDateTime) {
        const date = new Date(isoDateTime);
        const now = new Date();

        const deltaTimeMilli = now.getTime() - date.getTime();
        // const deltaTimeSec = Math.floor(deltaTimeMilli / 1000);
        const deltaTimeMin = Math.floor(deltaTimeMilli / (1000 * 60));
        const deltaTimeHours = Math.floor(deltaTimeMin / 60);
        const deltaTimeDays = Math.floor(deltaTimeHours / 24);
        const deltaTimeYears = Math.floor(deltaTimeDays / 365)

        if(deltaTimeYears > 0) {
            return `Ajouté il y a ${deltaTimeYears} an(s).`
        } else if(deltaTimeDays > 0) {
            return `Ajouté il y a ${deltaTimeDays} jour(s).`
        } else if(deltaTimeHours > 0) {
            return `Ajouté il y a ${deltaTimeHours} heure(s).`
        } else if(deltaTimeMin > 0) {
            return `Ajouté il y a ${deltaTimeMin} minute(s).`
        } else {
            return 'Ajouté il y a quelques secondes.'
        }
    }

    async getNominatimInfos(lat, lng) {
        const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;

        try {
            return (await fetch(nominatimUrl)).json();
        } catch(err) {
            console.error(err);
        }
    }
}

class VaderMap {
    constructor(mapElementId, /* vaderWebSocket,*/ mapOrigin = [46.8, 2.7], mapZoom = 3, maxZoom = 18) {

        // --- WebSocket --- //
        // this.ws = vaderWebSocket; 
        // this.socket = this.ws.getConn(); // websocket connection
        // ----------------- //

        if(iOS()) {
            this.iconSize = [35, 35];
            this.pointerSize = [10, 10];
        } else {
            this.iconSize = [40, 40];
            this.pointerSize = [15, 15];
        }

        this.mapId = mapElementId;
        this.mapOrigin = mapOrigin;
        this.mapZoom = mapZoom;
        this.maxZoom = maxZoom;
        this.activeMarkers = [];

        this.api = new VaderAPI();
        this.utils = new VaderUtilities();
        
        this.currentPos = {
            marker: null,
            accCircle: null,
            zoomed: null
        };

        this.geoLoc = false;

        this.centerToScreenBtn = document.getElementById('center-to-pos');
        this.centerToScreenBtnContainer = document.getElementById('center-to-pos-container');

        const IMG_PATH = 'img/';
        this.icons = {
            pointer: IMG_PATH + 'pointer.svg',
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

        this.initClusters();
        this.initGeoLoc(fitBounds);

         
        const loadDataOnMap = f => { // f for 'filters' (list of filters)

            // Filters
            const claimFilters = ['claimed', 'unclaimed'];
            const stateFilters = ['active', 'inexistent', 'damaged', 'broken'];

            const noClaimFilter = !claimFilters.some(filter => f.includes(filter));
            const noStateFilter = !stateFilters.some(filter => f.includes(filter));
            const noFavoriteFilter = !f.includes('favorite');

            this.clearClusters();

            const filteredInvaders = this.data.invaders.filter(invader => {
                const hasInv = this.hasInvader(this.currentUser, invader);

                let claimCondition = false;
                if(hasInv) {
                    claimCondition = f.includes('claimed') || noClaimFilter;
                } else {
                    claimCondition = f.includes('unclaimed') || noClaimFilter;
                }

                let stateCondition = false;
                if(invader.state == 0) {
                    stateCondition = f.includes('active') || noStateFilter
                } else if(invader.state == 1) {
                    stateCondition = f.includes('inexistent') || noStateFilter
                } else if(invader.state == 2) {
                    stateCondition = f.includes('broken') || noStateFilter
                } else if(invader.state == 3) {
                    stateCondition = f.includes('damaged') || noStateFilter
                }

                let favoriteCondition = false;
                if(this.isFavorite(this.currentUser, invader)) {
                    favoriteCondition = f.includes('favorite');
                } else {
                    favoriteCondition = noFavoriteFilter;
                }

                return claimCondition && stateCondition && favoriteCondition;
            });

            filteredInvaders.forEach(async invader => {
                await this.addInvaderMarker(invader.lat, invader.lng);
            });

            return filteredInvaders.length;
        }

        if(this.data) {
            let count = loadDataOnMap([]);

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
                let invaderMarker = L.marker(newInvader, { icon: this.redInvaderDebugIcon });
                this.addMarkerToCluster(invaderMarker);
                this.activeMarkers.push(invaderMarker);
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

            let content = document.createElement('div');
            content.innerHTML = `Si possible, donnez son identifiant (voir application flashInvaders&copy;) :
            <div class="input-group mb-3 mt-3">
                <select id="invader-city" class="form-control" style="max-width: fit-content;">${optionsString}</select>
                <span class="input-group-text">_</span>
                <input id="invader-id" class="form-control" type="number">
            </div>
            <small>Cela permet d'ajouter automatiquement une image.</small>`

            let validate = await this.utils.confirmationModal(`Ajouter l'invader <strong>n°${this.data.invaders.length + 1}</strong> ?`, content, ['invader-city', 'invader-id'])

            if(validate) {
                let latLng = e.latlng;


                let rawInvId = validate['invader-id'];
                let rawCity = validate['invader-city'];

                let isValid = this.validInvaderName(rawCity, rawInvId);

                const maxId = this.cities[rawCity].invaders;
                const cityName = this.cities[rawCity].name;
                if(!isValid) {
                    alert(`Cet identifiant est supérieur à l\'identifiant maximal pour cette région (${maxId} à ${cityName}) ou inférieur à 1.`)
                } else {
                    this.addInvader(latLng.lat, latLng.lng, rawCity, Number(rawInvId));
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

            const popUpElement = invaderMarker.getPopup().getContent();
            const invaderImageElement = popUpElement.querySelector('.invader-img');
            const src = invaderImageElement.getAttribute('src');

            if (src === '' && invader && invader.city && invader.inv_id != null) {
                const invaderImage = (await this.api.getInvaderImage(invader.city, invader.inv_id)).img;
                invaderImageElement.setAttribute('src', invaderImage);
                invaderMarker.setPopupContent(popUpElement);
            }
        }

        this.map.on('click', mapClick);
        this.map.on('mousemove', updateLatLngText);
        this.map.on('popupopen', loadInvaderImage);

        // DATA FROM BOOTSTRAP-SELECT 'filters' ON MAP PAGE

        this.filters = [];

        const selectFilters = $('#select-filters')
        selectFilters.on('changed.bs.select', e => {
            this.filters = selectFilters.val(); // list of active filters.

            loadDataOnMap(this.filters);
        });
    }

    initClusters() {
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

    removeMarkerFromCluster(marker) {
        this.markerClusterGroup.removeLayer(marker);
    }
    
    clearClusters() {
        this.markerClusterGroup.clearLayers();
    }

    initGeoLoc(fitBounds = true) {
        const geolocDenied = (err) => {
            this.geoLoc = false;

            this.centerToScreenBtn.disabled = true;
            // data-bs-container="body" data-bs-toggle="popover" data-bs-placement="left" data-bs-content="Left popover"
            this.centerToScreenBtnContainer.setAttribute('data-bs-container', 'body');
            this.centerToScreenBtnContainer.setAttribute('data-bs-toggle', 'popover');
            this.centerToScreenBtnContainer.setAttribute('data-bs-placement', 'auto');
            this.centerToScreenBtnContainer.setAttribute('data-bs-content', 'Localisation impossible.');

            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            const popoverList = [...popoverTriggerList].map(popoverTriggerEl => { 
                new bootstrap.Popover(popoverTriggerEl) ;
            });

            if (err.code === 1) {
                console.error('Géolocalisation non acceptée.');
            } else {
                console.error(err);
            }
        }

        navigator.geolocation.watchPosition((pos) => {
            this.geoLoc = true;

            this.centerToScreenBtn.disabled = false;
            this.centerToScreenBtnContainer.removeAttribute('data-bs-container');
            this.centerToScreenBtnContainer.removeAttribute('data-bs-toggle');
            this.centerToScreenBtnContainer.removeAttribute('data-bs-placement');
            this.centerToScreenBtnContainer.removeAttribute('data-bs-content');

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

    centerToPosition() {
        if(this.geoLoc)
            this.map.fitBounds(this.currentPos.accCircle.getBounds());
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

    async getInvaderImage(invader) {
        if(invader.city && invader.inv_id != null) 
            return (await this.api.getInvaderImage(invader.city, invader.inv_id)).img;
        return null
    }

    centerToInvader(lat, lng) {
        const invader = this.getInvaderMarker(lat, lng);
        if(invader) {
            this.map.setView(invader.getLatLng(), 19);
            invader.openPopup();
        }
    }

    async addInvader(lat, lng, city, inv_id) {
        const invader = this.getInvaderDataFromID(city, inv_id);
        if(!invader || !city || inv_id == null) {
            await this.api.addInvader(lat, lng, city, inv_id);
            await this.reloadData();
            await this.addInvaderMarker(lat, lng);

            /* this.socket.emit('broadcast_req', { 
                event: 'add_invader',
                data: { lat: lat, lng: lng }
            }); */
        } else {
            const invaderStr = `${invader.city}_${invader.inv_id}`;
            const content = document.createElement('div');
            content.innerHTML = `
                <p>L'invader ${invaderStr} existe déjà, voulez-vous le déplacer ?</p>
            `

            let validate = await this.utils.confirmationModal(`Déplacer l'invader ${invaderStr} ?`, content, [])

            if(validate) {
                const invaderMarker = this.getInvaderMarker(invader.lat, invader.lng);
                await this.api.moveInvader(invader.lat, invader.lng, lat, lng);
                await this.reloadData();
                await this.deleteInvaderMarker(invaderMarker);
                await this.addInvaderMarker(lat, lng);
            }
        }
    }

    deleteInvaderMarker(marker) {
        this.removeMarkerFromCluster(marker);
        this.activeMarkers.splice(this.activeMarkers.indexOf(marker), 1);
    }

    async updateInvader(lat, lng) {
        await this.reloadData();
        const marker = this.getInvaderMarker(lat, lng)
        this.removeMarkerFromCluster(marker);
        await this.addInvaderMarker(lat, lng);
    }

    async updateClaimState(lat, lng) {
        await this.api.claimInvader(lat, lng);
        await this.updateInvader(lat, lng);
    }

    async updateComment(lat, lng, comment) {
        await this.api.updateInvaderComment(lat, lng, comment);
        await this.updateInvader(lat, lng);
    }

    async updateFavoriteState(lat, lng) {
        // ...

    }

    async updateExistence(lat, lng, state) {
        await this.api.changeState(lat, lng, state);
        await this.updateInvader(lat, lng);
    }

    async updateCityId(lat, lng, city, inv_id) {
        const invader = this.getInvaderDataFromID(city, inv_id);
        if(!invader) {
            await this.api.updateInvader(lat, lng, city, inv_id);
            await this.updateInvader(lat, lng);
        } else {
            const content = document.createElement('div');
            content.innerHTML = `
                L'invader ${invader.city}_${invader.inv_id} existe déjà.
            `

            this.utils.informationModal('', content)
        }
    }

    hasInvader(user, invader) {
        if(invader.users.map(obj => obj.id).includes(user.id)) {
            return true;
        }
        return false;
    }

    isFavorite(user, invader) {
        // TODO v2.3.3
        return false; 
    }

    getInvaderData(lat, lng) {
        const invaders = this.data.invaders.filter(invader => 
            (invader.lat === lat && invader.lng === lng)
        );
        if(invaders.length > 0)
            return invaders[0];
        return null
    }

    getInvaderDataFromID(city, inv_id) {
        const invaders = this.data.invaders.filter(invader => 
            (invader.city === city && invader.inv_id === inv_id)
        );
        if(invaders.length > 0)
            return invaders[0];
        return null
    }

    invaderExists(lat, lng) {
        return this.getInvaderData(lat, lng) ? true : false
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

    getInvaderIconByState(state, hasInvader, url = false) {
        if(hasInvader) {
            if(state == 1)
                return url ? this.icons.inexistentInvaderWhite : this.inexistentInvaderWhiteIcon;
            else if(state == 2)
                return url ? this.icons.brokenInvaderWhite : this.brokenInvaderWhiteIcon;
            else if(state == 3)
                return url ? this.icons.damagedInvaderWhite : this.damagedInvaderWhiteIcon;
            return url ? this.icons.invader : this.invaderIcon;
        } else {
            if(state == 1)
                return url ? this.icons.inexistentInvader : this.inexistentInvaderIcon;
            else if(state == 2) 
                return url ? this.icons.brokenInvader : this.brokenInvaderIcon;
            else if(state == 3) 
                return url ? this.icons.damagedInvader : this.damagedInvaderIcon;
            return url ? this.icons.otherInvader : this.otherInvaderIcon;
        }
    }

    async invaderInformationsModal(invader) {
        const invaderName = this.utils.getFormatedInvaderName(invader);
        const invaderDate = new Date(invader.date);

        const lat = invader.lat;
        const lng = invader.lng;

        // User specific
        const isInvaderOwner = invader.users.length > 0 ? this.currentUser.id === invader.users[0].id : true;
        let hasInvader = this.hasInvader(this.currentUser, invader);
        let isFavorite = this.isFavorite(this.currentUser, invader);

        let formatedUsers = (users) => {   
            return users.map(
                user => `
                    <li class="list-group-item">
                        <a class="btn btn-sm text-decoration-none" href="/user/${user.name}">
                            ${user.name}
                        </a>
                    </li>
                `
            ).join('');
        }

        formatedUsers = formatedUsers == '' ? '<li class="list-group-item">Aucun utilisateur</li>' : formatedUsers

        const getClaimBtnObj = (hasInvader) => { 
            return hasInvader ? {
                class: 'btn-outline-primary',
                content: 'Ne plus marquer'
            } : {
                class: 'btn-primary',
                content: 'Marquer'
            }
        }

        const getMarkFavoriteBtnObj = (isFavorite) => {
            return isFavorite ? {
                class: 'btn-warning',
                content: 'Ne plus marquer comme favori'
            } : {
                class: 'btn-outline-warning',
                content: 'Marquer comme favori'
            }
        }

        let claimBtnObj = getClaimBtnObj(hasInvader);
        let markFavoriteBtnObj = getMarkFavoriteBtnObj(isFavorite);

        const deleteBtnExists = isInvaderOwner || this.currentUser.privileges >= 1
        const deleteInvaderHTML = deleteBtnExists ? '<button id="delete-invader" class="btn btn-danger" style="width: 100%" data-bs-target="#modal1" data-bs-toggle="modal">Supprimer</button>' : ''


        const commentContent = (comment) => {
            return `<div class="card-header">Commentaire (<button id="add-invader-comment" class="btn btn-sm btn-link" data-bs-target="#modal1" data-bs-toggle="modal">modifier</button>)</div>
            <div class="card-body">${comment}</div>`
        }

        const invaderCommentHTML = invader.comment ? `
            <div id="invader-comment" class="card">
                ${commentContent(invader.comment)}
            </div>
        ` : `
            <div id="invader-comment" class="card">
                <button id="add-invader-comment" class="btn btn-sm btn-secondary" data-bs-target="#modal1" data-bs-toggle="modal">Ajouter un commentaire</button>
            </div>
        `

        const htmlContent = `
            <div class="row g-4">
                <div class="col d-flex flex-column gap-3">
                    <div class="d-flex gap-4">
                        <img id="invader-image-modal" src="" class="rounded" alt="InvaderImage" style="min-width: 120px" width="120px" height="120px">
                        <div class="d-flex flex-fill flex-column gap-3 align-items-center justify-content-center">
                            <button id="claim-invader" class="btn ${claimBtnObj.class}" style="width: 100%">${claimBtnObj.content}</button>
                            <div style="width: 100%" data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Arrive bientôt (v2.3.3)">
                                <button id="mark-invader-as-favorite" class="btn btn-sm ${markFavoriteBtnObj.class}" style="width: 100%" disabled>${markFavoriteBtnObj.content}</button>
                            </div>
                        </div>
                    </div>
                    ${deleteInvaderHTML}
                    ${invaderCommentHTML}
                    <div class="card">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">${invaderDate.toLocaleString()}</li>
                            <li class="list-group-item">${this.utils.getFormatedDeltaTime(invaderDate.toISOString())}</li>
                            <li class="list-group-item d-flex gap-3 align-items-center">
                                <textarea name="invader-coordinates" class="form-control">${invader.lat},${invader.lng}</textarea>

                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16" style="cursor: pointer;" for="invader-coordinates">
                                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                                </svg>
                                </small>
                            </li>
                        </ul>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            Statut : <span id="invader-status">${this.utils.getFormatedState(invader.state)}</span> <img id="invader-status-img" src="${this.getInvaderIconByState(invader.state, hasInvader, true)}" width=30/>
                        </div>
                        <div class="card-body">
                            <button id="change-status" class="btn btn-sm btn-warning" style="width: 100%" data-bs-target="#modal1" data-bs-toggle="modal">Changer l'état</button>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <div class="card-header">
                            Utilisateurs
                        </div>
                        <ul class="list-group list-group-flush" id="invader-owners">
                            ${formatedUsers(invader.users)}
                        </ul>
                    </div>
                </div>
            </div>
        `

        const content = document.createElement('div');
        content.innerHTML = htmlContent

        const invaderOwners = content.querySelector('#invader-owners');

        const claimBtn = content.querySelector('#claim-invader');
        claimBtn.onclick = async () => {
            hasInvader = !hasInvader;
            
            claimBtn.classList.remove(claimBtnObj.class);
            claimBtnObj = getClaimBtnObj(hasInvader);
            claimBtn.classList.add(claimBtnObj.class);
            claimBtn.innerHTML = claimBtnObj.content;

            if(hasInvader) {
                invader.users.push(this.currentUser);
            } else {
                let newUserList = invader.users.filter(user => user.name !== this.currentUser.name)
                invader.users = newUserList;
            }

            let newUserListEl = formatedUsers(invader.users);
            invaderOwners.innerHTML = newUserListEl;

            await this.updateClaimState(lat, lng);
        }

        const markFavoriteBtn = content.querySelector('#mark-invader-as-favorite');
        markFavoriteBtn.onclick = async () => {
            isFavorite = !isFavorite;
            
            markFavoriteBtn.classList.remove(markFavoriteBtnObj.class);
            markFavoriteBtnObj = getMarkFavoriteBtnObj(isFavorite);
            markFavoriteBtn.classList.add(markFavoriteBtnObj.class);
            markFavoriteBtn.innerHTML = markFavoriteBtnObj.content;

            await this.updateFavoriteState(lat, lng);
        }

        const changeStatusBtn = content.querySelector('#change-status');
        const invaderStatusEl = content.querySelector('#invader-status');
        const invaderStatusImgEl = content.querySelector('#invader-status-img');
        changeStatusBtn.onclick = async () => { 
            let status = await this.changeInvaderStatusModal(invader);
            if(status) {
                invaderStatusEl.innerHTML = this.utils.getFormatedState(status['invader-status']);
                invaderStatusImgEl.setAttribute('src', this.getInvaderIconByState(status['invader-status'], hasInvader, true));
            }
        }

        if(deleteBtnExists) {
            const deleteInvaderBtn = content.querySelector('#delete-invader');
            deleteInvaderBtn.onclick = () => { 
                this.deleteInvaderModal(invader); 
            };
        }

        const invaderCommentElement = content.querySelector('#invader-comment');
        const addInvaderCommentBtn = content.querySelector('#add-invader-comment');
        addInvaderCommentBtn.onclick = async () => {
            let comment = await this.updateInvaderCommentModal(invader);
            if(comment) {
                invaderCommentElement.innerHTML = commentContent(comment['invader-comment']);
            }
        };

        this.utils.informationModal(`Fiche d'identité de <strong>${invaderName}</strong>`, content, '700px')

        const invaderImageElement = document.getElementById('invader-image-modal');
        const invaderImage = await this.getInvaderImage(invader) || this.icons.inexistentInvader;
        invaderImageElement.src = invaderImage;

        const copyCoordinatesBtn = content.querySelector('[for="invader-coordinates"]');
        copyCoordinatesBtn.onclick = () => {
            const coordinates = content.querySelector('[name="invader-coordinates"]');
            coordinates.focus();
            coordinates.select();

            try {
                let success = document.execCommand('copy');
            } catch(err) {
                console.error(err);
            }
        }
    }

    validInvaderName(rawCity, rawInvId) {
        let inv_id = rawInvId != null ? Number(rawInvId) : null;
        let city = inv_id != null ? rawCity : null;

        let maxId = this.cities[rawCity].invaders;
        maxId = city == 'LIL' ? maxId - 1 : maxId
        return (1 <= inv_id && inv_id <= maxId) || (city == 'LIL' && 0 <= inv_id && inv_id <= maxId)
    }

    async changeInvaderNameModal(invader) { 
        let optionsString = '';
        Object.keys(this.cities).forEach(cityCode => {
            let selected = cityCode == invader.city ? 'selected' : 'PA';
            optionsString += `<option value="${cityCode}" ${selected}>${cityCode}</option>`
        });
        let idDefaultValue = invader.inv_id ? invader.inv_id : 0;

        const content = document.createElement('div');
        content.innerHTML = `
            <div class="input-group mb-3 mt-3">
                <select id="invader-city" class="form-control" style="max-width: fit-content;">${optionsString}</select>
                <span class="input-group-text">_</span>
                <input id="invader-id" class="form-control" type="number" value="${idDefaultValue}">
            </div>
            <small>Spécifier un identifiant permet d'ajouter automatiquement une image.</small>
        `

        let validate = await this.utils.confirmationModal(`Modifier l'invader <strong>${invader.city}_${invader.inv_id}</strong> ?`,
            content, 
            ['invader-city', 'invader-id']
        )

        if(validate) {
            let rawInvId = validate['invader-id'];
            let rawCity = validate['invader-city'];

            let maxId = this.cities[rawCity].invaders;
            maxId = rawCity == 'LIL' ? maxId - 1 : maxId
            const cityName = this.cities[rawCity].name;

            if(!this.validInvaderName(rawCity, rawInvId)) {
                alert(`Cet identifiant est supérieur à l\'identifiant maximal pour cette région (${maxId} à ${cityName}) ou inférieur à 1 (ou 0 pour Lille).`)
            } else {
                this.updateCityId(invader.lat, invader.lng, rawCity, Number(rawInvId));
            }
        }
    };

    async changeInvaderStatusModal(invader) { 
        let optionsString = ''
        for (let i = 0; i <= 3; i++) {
            let selected = invader.state == i ? 'selected' : ''
            optionsString += `<option value="${i}" ${selected}>${this.getStatusFrom(i)}</option>`
        }

        const content = document.createElement('div');
        content.innerHTML = `
            <p>Choisissez l'état dans lequel est l'invader :</p>
            <div class="input-group mb-3 mt-3">
                <select id="invader-status" class="form-control">${optionsString}</select>
            </div>
        `;

        let newState = await this.utils.confirmationModal(`<strong>Modifier le statut de ${invader.city}_${invader.inv_id}.</strong>`,
            content, 
            ['invader-status'],
            -1, -1, 1 // -1, -1 refer to the default width and height of the modal, 1 refers to the depth of nested modal.
        )

        if(newState) {
            let status = Number(newState['invader-status'])
            await this.updateExistence(invader.lat, invader.lng, status); 
        }

        return newState
    };

    async deleteInvaderModal(invader) { 
        const invaderName = this.utils.getFormatedInvaderName(invader);

        const content = document.createElement('div');
        content.innerHTML = `<p>Confirmez-vous la suppression de l'invader ${invaderName} ? Cette action est irréversible.</p>`;

        let confirms = await this.utils.confirmationModal(`<strong>Suppression</strong>`,
            content, 
            [],
            -1, -1, 1, // -1, -1 refer to the default width and height of the modal, 1 refers to the depth of nested modal.
            true // Dismiss previous modal when validating
        )

        if(confirms) {
            const marker = this.getInvaderMarker(invader.lat, invader.lng);
            this.deleteInvaderMarker(marker);
            await this.api.deleteInvader(invader.lat, invader.lng);
            await this.reloadData();
        }

        return confirms;
    };

    async updateInvaderCommentModal(invader) { 
        const invaderName = this.utils.getFormatedInvaderName(invader);

        const content = document.createElement('div');
        content.innerHTML = `<p>Ajoutez/modifiez un commentaire concernant ${invaderName}. Cela permet de donner des indications concernant son emplacement s'il n'est pas évident.</p>
        <div class="mb-3">
            <label for="invader-comment" class="form-label">Commentaire</label>
            <textarea class="form-control" id="invader-comment" rows="5">${invader.comment ? invader.comment : ''}</textarea>
        </div>
        `;

        let comment = await this.utils.confirmationModal(`<strong>Ajouter un commentaire.</strong>`,
            content, 
            ['invader-comment'],
            -1, -1, 1, // -1, -1 refer to the default width and height of the modal, 1 refers to the depth of nested modal.
        )

        if(comment) {
            let newValue = comment['invader-comment'];
            await this.updateComment(invader.lat, invader.lng, newValue);
        }

        return comment
    };

    async addInvaderMarker(lat, lng) {
        const invader = this.getInvaderData(lat, lng);
        const hasInvader = this.hasInvader(this.currentUser, invader);
        const invaderName = this.utils.getFormatedInvaderName(invader);
        const invaderNum = this.data.invaders.indexOf(invader) + 1 // This is NOT the invader's ID, just it's number of appearence in the database.

        let invaderIcon = this.getInvaderIconByState(invader.state, hasInvader)
        let invaderMarker = L.marker([lat, lng], { icon: invaderIcon });
        this.addMarkerToCluster(invaderMarker);

        const date = new Date(invader.date);

        date.setHours(date.getHours() + 2);
        let invaderContainer = document.createElement('div');
        ['d-flex', 'flex-column', 'gap-2', 'align-items-center', 'justify-content-center', 'text-white'].forEach(style => {
            invaderContainer.classList.add(style)
        });
        invaderContainer.innerHTML = '<img class="invader-img rounded" src="" style="width: 140px"></img>';

        // ------------------------- //

        let nameChangeBtn = document.createElement('button');
        nameChangeBtn.classList.add('name-change-btn');
        nameChangeBtn.innerHTML = `<strong class="name-change text-center">${invaderName}</strong> <span style="color: gray; font-size: 10px;">(#${invaderNum})</span>`;
        nameChangeBtn.style.background = 'transparent';
        nameChangeBtn.style.border = 'none';
        nameChangeBtn.style.cursor = 'pointer';
        nameChangeBtn.onclick = async () => await this.changeInvaderNameModal(invader)

        invaderContainer.insertBefore(nameChangeBtn, invaderContainer.firstChild);

        // ------------------------- //

        let infoModal = document.createElement('button');
        ['btn', 'btn-sm', 'btn-secondary'].forEach(style => {
            infoModal.classList.add(style);
        });
        infoModal.innerHTML = `Informations`;
        infoModal.onclick = () => { 
            this.invaderInformationsModal(invader)
        };

        invaderContainer.appendChild(infoModal);

        invaderMarker.bindPopup(invaderContainer);
        this.activeMarkers.push(invaderMarker);
    }

    async reloadData() {
        this.data = await this.api.getMapData();
    }
}