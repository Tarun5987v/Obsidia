// function initMap() {
//     const map = L.map("map");
//     // Default coordinates (New Delhi) used if geocoding is not applied
//     const defaultCoords = [28.6139, 77.2090];
//     map.setView(defaultCoords, 13);

//     // Choose tile provider: MapTiler if API key present, otherwise OpenStreetMap
//     let tileUrl;
//     if (typeof maptilerApiKey !== 'undefined' && maptilerApiKey) {
//         tileUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerApiKey}`;
//     } else {
//         tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
//     }

//     L.tileLayer(tileUrl, {
//         tileSize: 512,
//         zoomOffset: -1,
//         attribution: '&copy; Map tiles'
//     }).addTo(map);

//     const marker = L.marker(defaultCoords).addTo(map);
//     marker.bindPopup(listingLocation).openPopup();

//     // Attempt to geocode the listingLocation to center the map appropriately
//     async function geocodeLocation(query) {
//         if (!query || !query.trim()) return null;
//         try {
//             // Try MapTiler geocoding if API key is available
//             if (typeof maptilerApiKey !== 'undefined' && maptilerApiKey) {
//                 const encoded = encodeURIComponent(query);
//                 const res = await fetch(`https://api.maptiler.com/geocoding/${encoded}.json?key=${maptilerApiKey}`);
//                 if (!res.ok) throw new Error('MapTiler geocoding request failed');
//                 const data = await res.json();
//                 if (data && data.features && data.features.length > 0) {
//                     const [lon, lat] = data.features[0].geometry.coordinates;
//                     return [lat, lon];
//                 }
//             }
//             // Fallback to Nominatim (OpenStreetMap)
//             const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
//             if (!res2.ok) throw new Error('Nominatim request failed');
//             const data2 = await res2.json();
//             if (data2 && data2.length > 0) {
//                 return [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
//             }
//         } catch (err) {
//             console.error('Geocoding error:', err);
//             return null;
//         }
//         return null;
//     }

//     geocodeLocation(listingLocation).then(coords => {
//         if (coords) {
//             map.setView(coords, 13);
//             marker.setLatLng(coords).bindPopup(listingLocation).openPopup();
//         }
//     }).catch(err => console.error('Geocoding unexpected error:', err));
// }

// // Ensure Leaflet (`L`) is available before running the initializer.
// if (typeof L === 'undefined') {
//     // Wait for window load and then poll for L in case scripts load late.
//     window.addEventListener('load', () => {
//         if (typeof L !== 'undefined') return initMap();
//         const t = setInterval(() => {
//             if (typeof L !== 'undefined') {
//                 clearInterval(t);
//                 initMap();
//             }
//         }, 100);
//         // Stop polling after 10 seconds to avoid infinite loop
//         setTimeout(() => clearInterval(t), 10000);
//     });
// } else {
//     initMap();
// }

function initMap() {
    if (typeof L === 'undefined') return;

    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    // Determine coordinates: prefer `listingCoordinates` global, else read from data-coords attribute
    let coords = undefined;
    if (typeof listingCoordinates !== 'undefined' && listingCoordinates) {
        coords = listingCoordinates;
    } else if (mapEl.dataset && mapEl.dataset.coords) {
        try {
            coords = JSON.parse(mapEl.dataset.coords);
        } catch (e) {
            console.error('Invalid listing coordinates in data-coords', e);
            return;
        }
    }

    // Only render the map using coordinates from the server (MongoDB GeoJSON in data-coords)
    if (!coords || !Array.isArray(coords) || coords.length < 2) {
        console.warn('No coordinates available to render map (show page expects geometry from DB)');
        return;
    }

    // MongoDB GeoJSON: [longitude, latitude]
    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    const mapCoords = [latitude, longitude];

    const map = L.map('map').setView(mapCoords, 13);

    // Choose tile provider: MapTiler when key present, otherwise OpenStreetMap
    let tileUrl;
    if (typeof maptilerApiKey !== 'undefined' && maptilerApiKey) {
        tileUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerApiKey}`;
    } else {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    L.tileLayer(tileUrl, {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '&copy; Map tiles'
    }).addTo(map);

    const popupText = (typeof listingLocation !== 'undefined') ? listingLocation : (mapEl.dataset.location || '');
    L.marker(mapCoords)
        .addTo(map)
        .bindPopup(popupText)
        .openPopup();
}


initMap();

// Initialize an interactive map for the new-listing form
window.initNewListingMap = function(options = {}) {
    if (typeof L === 'undefined') return;
    const mapId = options.mapId || 'new-map';
    const coordsInputId = options.coordsInputId || 'geometry-coordinates';
    const locationInputId = options.locationInputId || 'location';
    const defaultCoords = options.defaultCoords || [28.6139, 77.2090];

    const el = document.getElementById(mapId);
    if (!el) return;

    const map = L.map(mapId).setView(defaultCoords, 4);
    let tileUrl;
    if (typeof maptilerApiKey !== 'undefined' && maptilerApiKey) {
        tileUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerApiKey}`;
    } else {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    L.tileLayer(tileUrl, {
        tileSize: 512,
        zoomOffset: -1,
        attribution: "&copy; Map tiles"
    }).addTo(map);

    let marker = null;
    const coordsInput = document.getElementById(coordsInputId);
    const locationInput = document.getElementById(locationInputId);

    function setMarker(latlng) {
        if (!marker) marker = L.marker(latlng).addTo(map);
        else marker.setLatLng(latlng);
        map.setView(latlng, 13);
        if (coordsInput) coordsInput.value = JSON.stringify([latlng.lng, latlng.lat]);
    }

    map.on('click', function(e) {
        setMarker(e.latlng);
    });

    // If coords input already set (e.g. validation returned), show it
    if (coordsInput && coordsInput.value) {
        try {
            const parts = JSON.parse(coordsInput.value);
            if (Array.isArray(parts) && parts.length === 2) {
                setMarker({lng: parts[0], lat: parts[1]});
            }
        } catch (e) {
            const parts = coordsInput.value.split(',').map(Number);
            if (parts.length === 2) setMarker({lng: parts[0], lat: parts[1]});
        }
    }
};