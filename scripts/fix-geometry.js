#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const fetch = global.fetch || require('node-fetch');
const Listing = require('../models/listing');

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wanderLust';
  await mongoose.connect(uri);
}

async function geocodeLocation(location) {
  if (!location || !location.trim()) return null;
  const encoded = encodeURIComponent(location);
  // Try MapTiler if API key present
  if (process.env.MAPTILER_API_KEY) {
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${encoded}.json?key=${process.env.MAPTILER_API_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const [lon, lat] = data.features[0].geometry.coordinates;
          return { type: 'Point', coordinates: [Number(lon), Number(lat)] };
        }
      }
    } catch (e) {
      console.warn('MapTiler geocode error:', e.message || e);
    }
  }
  // Fallback to Nominatim
  try {
    const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`, {
      headers: { 'User-Agent': 'ObsidiaFixScript/1.0', 'Accept-Language': 'en' }
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.length > 0) {
        const lat = parseFloat(data2[0].lat);
        const lon = parseFloat(data2[0].lon);
        return { type: 'Point', coordinates: [Number(lon), Number(lat)] };
      }
    }
  } catch (e) {
    console.warn('Nominatim geocode error:', e.message || e);
  }
  return null;
}

function coordsEqual(a, b, tol = 1e-6) {
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return false;
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
}

(async () => {
  try {
    const title = process.argv[2];
    if (!title) {
      console.error('Usage: node scripts/fix-geometry.js "listing title"');
      process.exit(1);
    }
    await connect();
    console.log('Connected to MongoDB');
    const listings = await Listing.find({ title });
    if (!listings || listings.length === 0) {
      console.log('No listings found with title:', title);
      return process.exit(0);
    }
    for (const listing of listings) {
      console.log('\nProcessing listing:', listing._id.toString(), 'title:', listing.title);
      const loc = listing.location;
      if (!loc) {
        console.log('  No location string to geocode; skipping.');
        continue;
      }
      const newGeom = await geocodeLocation(loc);
      if (!newGeom) {
        console.log('  Could not geocode location:', loc);
        continue;
      }
      const oldGeom = listing.geometry && listing.geometry.coordinates ? listing.geometry.coordinates : null;
      console.log('  Existing coords:', oldGeom, 'New coords:', newGeom.coordinates);
      if (oldGeom && coordsEqual(oldGeom, newGeom.coordinates)) {
        console.log('  Coordinates already match; no update needed.');
        continue;
      }
      // Update only the geometry field to avoid disturbing other data
      await Listing.findByIdAndUpdate(listing._id, { geometry: newGeom }, { runValidators: true });
      console.log('  Updated geometry for', listing._id.toString());
    }
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Script error:', err);
    process.exit(2);
  }
})();
