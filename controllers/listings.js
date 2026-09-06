const Listing = require("../models/listing");

module.exports.index =async (req,res)=>{
    const allListings =await Listing.find({});
    res.render("./listings/index.ejs",{allListings});
}

module.exports.renderNewForm = (req,res)=>{
   
    res.render("./listings/new.ejs");
};

module.exports.showListing = async (req,res)=>{
    let {id}=req.params;
    let listing = await Listing.findById(id)
        .populate({ path: 'reviews', populate: { path: 'author', select: 'username' } })
        .populate('owner', 'username');
    // listing lookup
    if (!listing) {
        // Render index with inline error to avoid 500 and ensure message is visible
        const allListings = await Listing.find({});
        res.locals.error = ["Listing Not Found !"];
        return res.render("./listings/index.ejs", { allListings });
    }
    // render listing
    console.log("Listing geometry:", listing.geometry);
    res.render("./listings/show.ejs",{listing});
}

module.exports.createListing = async (req,res)=>{
    let url = req.file ? req.file.path : null;
    let filename = url ? url : req.file ? req.file.filename : null;
    console.log("File URL:", url);
    console.log("File Filename:", filename);
    let {title, description, price, country, location} = req.body;
    try {
        // Geometry may be provided by middleware (req.geometry). If missing, allow creation without geometry.
        const geometry = req.geometry;
        if (!geometry) {
            req.flash('warning', 'Listing created without geometry (location not geocoded).');
        }

        let newListing = new Listing({
            title,
            description,
            image: {
                filename: filename ,
                url: url
            },
            price: Number(price),
            location,
            country,
            ...(geometry ? { geometry } : {}),
            owner: req.user ? req.user._id : undefined
        });

        await newListing.save();
        req.flash("success","New Listing Created !");
        return req.session.save(() => {
            res.redirect("/listings");
        });
    } catch (err) {
        console.error('Geocoding/create listing error:', err);
        req.flash('error', 'Could not determine location. Please refine the location and try again.');
        return req.session.save(() => {
            res.redirect('/listings/new');
        });
    }
}

module.exports.editListing = async (req,res)=>{
    let {id}=req.params
     const listing=await Listing.findById(id);
      if(!listing){
          // Render the listings index directly with an inline error message
          const allListings = await Listing.find({});
          res.locals.error = ["Listing Not Found !"];
          return res.render("./listings/index.ejs", { allListings });
      }
            let originalImageURL = listing.image && listing.image.url ? listing.image.url : '';
            // If it's a Cloudinary URL, insert a width transform to get a smaller preview
            if (originalImageURL && originalImageURL.includes('/upload/')) {
                originalImageURL = originalImageURL.replace('/upload/', '/upload/w_250/');
            }
         res.render("./listings/update.ejs",{listing, originalImageURL});
}

module.exports.updateListing = async(req,res)=>{
    let {id}=req.params;
    const {title, description, price, country, location} = req.body;
    const update = { title, description, country, location };
    if (price !== undefined && price !== null && price !== '') {
        update.price = Number(price);
    }
    if (req.file) {
        update.image = { filename: req.file.filename, url: req.file.path };
    }
    try {
        // If middleware set req.geometry (location changed), include it in update
        if (req.geometry) {
            update.geometry = req.geometry;
        }

        // Debug logs to help trace geometry updates
        try {
            const existing = await Listing.findById(id).lean();
            console.log('Existing listing geometry before update:', existing && existing.geometry);
            console.log('Update payload:', update);
        } catch (e) {
            console.error('Could not read existing listing for debug:', e);
        }

        await Listing.findByIdAndUpdate(id, update, { runValidators: true });
        req.flash("success","Listing Updated !");
        return req.session.save(() => {
            res.redirect("/listings");
        });
    } catch (err) {
        console.error('Update listing error:', err);
        req.flash('error', 'An error occurred while updating the listing.');
        return req.session.save(() => res.redirect(`/listings/${id}/edit`));
    }
};

module.exports.distroyListing = async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted !");
    return req.session.save(() => {
        res.redirect("/listings");
    });
};

