import fs from 'fs';
import L from 'leaflet';

const map = L.map('map').setView([51.505, -0.09], 13);
const pointer = L.icon({
    iconUrl: './img/pointer.png',
    iconSize: [100, 100]
});
const markerIcon = L.icon({
    iconUrl: './img/invader-logo-white.png',
    iconSize: [40, 40]
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const geolocDenied = (err) => {
    if(err.code === 1) 
        console.log('Géolocalisation non acceptée.');
    else 
        console.error(err);
}

let marker, circle, zoomed;

navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    if(marker && circle) {
        marker.remove();
        circle.remove();
    }
    marker = L.marker([lat, lng], { icon: pointer }).addTo(map);
    circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

    if(!zoomed) {
      zoomed = map.fitBounds(circle.getBounds());
    }
}, geolocDenied);

const mapClick = (e) => {
    let latLng = e.latlng;
    let spaceInvMarker = L.marker([latLng.lat, latLng.lng], { icon: markerIcon }).addTo(map)
    let deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = 'Delete';
    deleteBtn.onclick = () => { spaceInvMarker.remove(); };
    spaceInvMarker.bindPopup(deleteBtn);
}

map.on('click', mapClick);

class InitMap {
    constructor() {

    }
}