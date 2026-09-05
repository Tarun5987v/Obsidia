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
    res.render("./listings/show.ejs",{listing});
}

module.exports.createListing = async (req,res)=>{
    let url = req.file ? req.file.path : null;
    let filename = url ? url : req.file ? req.file.filename : null;
    console.log("File URL:", url);
    console.log("File Filename:", filename);
    let {title, description, price, country, location} = req.body;

    
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
        owner: req.user ? req.user._id : undefined
    });

        await newListing.save();
        req.flash("success","New Listing Created !")
        return req.session.save(() => {
            res.redirect("/listings");
        });
        
    
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
     res.render("./listings/update.ejs",{listing});
}

module.exports.updateListing = async(req,res)=>{
    let {id}=req.params;
    const {title, description, image, price, country, location} = req.body;
    const update = { title, description, country, location };
    if (price !== undefined && price !== null && price !== '') {
        update.price = Number(price);
    }
    if (typeof image === 'string' && image.trim()) {
        update.image = { filename: 'listingimage', url: image.trim() };
    }
        await Listing.findByIdAndUpdate(id, update, { runValidators: true });
        req.flash("success","Listing Updated !");
        return req.session.save(() => {
            res.redirect("/listings");
        });
};

module.exports.distroyListing = async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted !");
    return req.session.save(() => {
        res.redirect("/listings");
    });
};

