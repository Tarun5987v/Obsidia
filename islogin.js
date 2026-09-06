const Listing = require("./models/listing");
const Review = require("./models/review");
const fetch = global.fetch || require('node-fetch');


module.exports.islogin = (req,res,next)=>{
    if(!req.isAuthenticated()){
        if (req.session) {
            req.session.redirectUrl = req.originalUrl;
            req.session.save(() => {
                req.flash("error","You must be logged in first !");
                return res.redirect('/login?redirectTo=' + encodeURIComponent(req.originalUrl));
            });
        } else {
            req.flash("error","You must be logged in first !");
            return res.redirect("/login");
        }
        return;
    }
    next();
}

module.exports.saveRedirectUrl = async (req,res,next)=>{
    if(req.session && req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    return next();
}

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect(`/listings`);
    }
    const currentUserId = (res.locals && res.locals.currentUser && res.locals.currentUser._id) || (req.user && req.user._id);
    if (!listing.owner || !currentUserId || !listing.owner.equals(currentUserId)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.isReviewOwner = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect(`/listings`);
    }
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    const currentUserId = (res.locals && res.locals.currentUser && res.locals.currentUser._id) || (req.user && req.user._id);
    if (!review.author || !currentUserId || !review.author.equals(currentUserId)) {
        req.flash("error", "You are not the owner of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Middleware: parse client-provided geometry (from a map picker)
module.exports.parseClientGeometry = (req, res, next) => {
    if (req.body && req.body.geometry) {
        const coordsRaw = req.body.geometry.coordinates || req.body['geometry[coordinates]'];
        if (coordsRaw) {
            let coords = null;
            if (typeof coordsRaw === 'string') {
                try { coords = JSON.parse(coordsRaw); } catch (e) {
                    coords = coordsRaw.split(',').map(s => Number(s.trim()));
                }
            } else if (Array.isArray(coordsRaw)) {
                coords = coordsRaw.map(Number);
            }
            if (coords && coords.length === 2 && coords.every(n => !Number.isNaN(n))) {
                req.geometry = { type: 'Point', coordinates: [Number(coords[0]), Number(coords[1])] };
            }
        }
    }
    return next();
};

// Middleware: geocode location for create route
module.exports.geocodeForCreate = async (req, res, next) => {
    const location = req.body && req.body.location;
    // If client provided geometry (from a map picker), accept it and skip geocoding
    if (req.body && req.body.geometry && req.body.geometry.coordinates) {
        let coordsRaw = req.body.geometry.coordinates;
        let coords = null;
        if (typeof coordsRaw === 'string') {
            try { coords = JSON.parse(coordsRaw); } catch (e) {
                coords = coordsRaw.split(',').map(s => Number(s.trim()));
            }
        } else if (Array.isArray(coordsRaw)) {
            coords = coordsRaw.map(Number);
        }
        if (coords && coords.length === 2 && coords.every(n => !Number.isNaN(n))) {
            req.geometry = { type: 'Point', coordinates: [Number(coords[0]), Number(coords[1])] };
            return next();
        }
        // If provided geometry invalid, fall through to validate location below
    }
    if (!location || !location.trim()) {
        req.flash('error', 'Location is required');
        return req.session.save(() => res.redirect('/listings/new'));
    }
    try {
        const encodedLocation = encodeURIComponent(location);
        console.log('geocodeForCreate: attempting geocode for location ->', location);
        // Try MapTiler first if API key present
        if (process.env.MAPTILER_API_KEY) {
            try {
                const response = await fetch(`https://api.maptiler.com/geocoding/${encodedLocation}.json?key=${process.env.MAPTILER_API_KEY}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.features && data.features.length > 0) {
                        const [longitude, latitude] = data.features[0].geometry.coordinates;
                        req.geometry = { type: 'Point', coordinates: [longitude, latitude] };
                        console.log('Geocoded (MapTiler) for create:', req.geometry, 'feature:', data.features[0].place_name || (data.features[0].properties && data.features[0].properties.label));
                        return next();
                    }
                } else {
                    const bodyText = await response.text().catch(() => null);
                    console.warn('MapTiler geocoding failed', { status: response.status, body: bodyText });
                }
            } catch (mtErr) {
                console.warn('MapTiler geocoding error:', mtErr);
            }
        }
        // Fallback to Nominatim (OpenStreetMap) for server-side geocoding
        try {
            const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}`, {
                headers: {
                    'User-Agent': 'ObsidiaApp/1.0 (https://example.com)',
                    'Accept-Language': 'en'
                }
            });
            if (res2.ok) {
                const data2 = await res2.json();
                console.log('Nominatim response length:', Array.isArray(data2) ? data2.length : 'not-array');
                if (data2 && data2.length > 0) {
                    const lat = parseFloat(data2[0].lat);
                    const lon = parseFloat(data2[0].lon);
                    req.geometry = { type: 'Point', coordinates: [lon, lat] };
                    console.log('Geocoded (Nominatim) for create:', req.geometry, 'display_name:', data2[0].display_name);
                    return next();
                }
            } else {
                const bodyText = await res2.text().catch(() => null);
                console.warn('Nominatim geocoding failed', { status: res2.status, body: bodyText });
            }
        } catch (nomErr) {
            console.warn('Nominatim geocoding error:', nomErr);
        }

        // If both geocoders failed, allow creation but don't set geometry
        req.flash('warning', 'Could not determine location; listing will be created without geometry.');
        req.geometry = undefined;
        return next();
    } catch (err) {
        console.error('Geocoding (create) unexpected error:', err);
        req.flash('warning', 'Geocoding error; listing will be created without geometry.');
        req.geometry = undefined;
        return next();
    }
};

// Middleware: geocode if location changed on update
module.exports.geocodeForUpdate = async (req, res, next) => {
    const { id } = req.params;
    const newLocation = req.body && req.body.location;
    // Load existing listing early so we can decide whether to accept client geometry
    try {
        const existing = await Listing.findById(id);
        if (!existing) {
            req.flash('error', 'Listing not found');
            return req.session.save(() => res.redirect('/listings'));
        }

        // Accept client-provided geometry (from edit map picker) only when the textual location
        // has NOT changed. If the user changed the location string, prefer server-side geocoding
        // so geometry stays in sync with the new location.
        if (req.body && req.body.geometry && req.body.geometry.coordinates) {
            // If location text changed, ignore client geometry and geocode below
            if (existing.location && existing.location !== newLocation) {
                // fall through to geocoding
            } else {
                let coordsRaw = req.body.geometry.coordinates;
                let coords = null;
                if (typeof coordsRaw === 'string') {
                    try { coords = JSON.parse(coordsRaw); } catch (e) {
                        coords = coordsRaw.split(',').map(s => Number(s.trim()));
                    }
                } else if (Array.isArray(coordsRaw)) {
                    coords = coordsRaw.map(Number);
                }
                if (coords && coords.length === 2 && coords.every(n => !Number.isNaN(n))) {
                    req.geometry = { type: 'Point', coordinates: [Number(coords[0]), Number(coords[1])] };
                    return next();
                }
                // if invalid, fallthrough to geocoding logic
            }
        }
        if (!newLocation) return next();
        // If existing listing has no geometry, or the location text changed, we need to geocode
        const needsGeocode = !existing.geometry || !Array.isArray(existing.geometry.coordinates) || existing.geometry.coordinates.length < 2 || (existing.location && existing.location !== newLocation);
        if (!needsGeocode) {
            return next();
        }
        try {
            const encodedLocation = encodeURIComponent(newLocation);
            console.log('geocodeForUpdate: attempting geocode for new location ->', newLocation);
            // Try MapTiler first if key present
            if (process.env.MAPTILER_API_KEY) {
                try {
                    const response = await fetch(`https://api.maptiler.com/geocoding/${encodedLocation}.json?key=${process.env.MAPTILER_API_KEY}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.features && data.features.length > 0) {
                            const [longitude, latitude] = data.features[0].geometry.coordinates;
                            req.geometry = { type: 'Point', coordinates: [longitude, latitude] };
                            console.log('Geocoded (MapTiler) for update:', req.geometry, 'feature:', data.features[0].place_name || (data.features[0].properties && data.features[0].properties.label));
                            return next();
                        }
                    } else {
                        const bodyText = await response.text().catch(() => null);
                        console.warn('MapTiler geocoding failed (update)', { status: response.status, body: bodyText });
                    }
                } catch (mtErr) {
                    console.warn('MapTiler geocoding error (update):', mtErr);
                }
            }
            // Fallback to Nominatim
            try {
                const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}`, {
                    headers: {
                        'User-Agent': 'ObsidiaApp/1.0 (https://example.com)',
                        'Accept-Language': 'en'
                    }
                });
                if (res2.ok) {
                    const data2 = await res2.json();
                    console.log('Nominatim response length (update):', Array.isArray(data2) ? data2.length : 'not-array');
                    if (data2 && data2.length > 0) {
                        const lat = parseFloat(data2[0].lat);
                        const lon = parseFloat(data2[0].lon);
                        req.geometry = { type: 'Point', coordinates: [lon, lat] };
                        console.log('Geocoded (Nominatim) for update:', req.geometry, 'display_name:', data2[0].display_name);
                        return next();
                    }
                } else {
                    const bodyText = await res2.text().catch(() => null);
                    console.warn('Nominatim geocoding failed (update)', { status: res2.status, body: bodyText });
                }
            } catch (nomErr) {
                console.warn('Nominatim geocoding error (update):', nomErr);
            }

            // If both geocoders failed, proceed without geometry
            req.flash('warning', 'Could not determine new location; listing will be updated without geometry.');
            req.geometry = undefined;
            return next();
        } catch (fetchErr) {
            console.error('Geocoding (update) unexpected error:', fetchErr);
            req.flash('warning', 'Could not determine new location; listing will be updated without geometry.');
            req.geometry = undefined;
            return next();
        }
    } catch (err) {
        console.error('Geocoding (update) unexpected error:', err);
        // Allow update to proceed; do not block user
        return next();
    }
};
