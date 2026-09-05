function initMap() {
    const map = L.map("map");
    // Default coordinates (New Delhi) used if geocoding is not applied
    const defaultCoords = [28.6139, 77.2090];
    map.setView(defaultCoords, 13);

    // Choose tile provider: MapTiler if API key present, otherwise OpenStreetMap
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

    const marker = L.marker(defaultCoords).addTo(map);
    marker.bindPopup(listingLocation).openPopup();

    // Attempt to geocode the listingLocation to center the map appropriately
    async function geocodeLocation(query) {
        if (!query || !query.trim()) return null;
        try {
            // Try MapTiler geocoding if API key is available
            if (typeof maptilerApiKey !== 'undefined' && maptilerApiKey) {
                const encoded = encodeURIComponent(query);
                const res = await fetch(`https://api.maptiler.com/geocoding/${encoded}.json?key=${maptilerApiKey}`);
                if (!res.ok) throw new Error('MapTiler geocoding request failed');
                const data = await res.json();
                if (data && data.features && data.features.length > 0) {
                    const [lon, lat] = data.features[0].geometry.coordinates;
                    return [lat, lon];
                }
            }
            // Fallback to Nominatim (OpenStreetMap)
            const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            if (!res2.ok) throw new Error('Nominatim request failed');
            const data2 = await res2.json();
            if (data2 && data2.length > 0) {
                return [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            return null;
        }
        return null;
    }

    geocodeLocation(listingLocation).then(coords => {
        if (coords) {
            map.setView(coords, 13);
            marker.setLatLng(coords).bindPopup(listingLocation).openPopup();
        }
    }).catch(err => console.error('Geocoding unexpected error:', err));
}

// Ensure Leaflet (`L`) is available before running the initializer.
if (typeof L === 'undefined') {
    // Wait for window load and then poll for L in case scripts load late.
    window.addEventListener('load', () => {
        if (typeof L !== 'undefined') return initMap();
        const t = setInterval(() => {
            if (typeof L !== 'undefined') {
                clearInterval(t);
                initMap();
            }
        }, 100);
        // Stop polling after 10 seconds to avoid infinite loop
        setTimeout(() => clearInterval(t), 10000);
    });
} else {
    initMap();
}