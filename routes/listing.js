const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const Review = require("../models/review");
const { validateListing, validateReview } = require("../public/validate");
const wrapAsync = require("../utils/wrapAsync");
const { islogin,isOwner } = require("../islogin");


//index route

router.get("/", wrapAsync(async (req,res)=>{
    const allListings =await Listing.find({});
    res.render("./listings/index.ejs",{allListings})
}))

// new route

router.get("/new",islogin,(req,res)=>{
   
    res.render("./listings/new.ejs")
})

//read route or show route

router.get("/:id", wrapAsync(async (req,res)=>{
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
    res.render("./listings/show.ejs",{listing})
}))

// creat rout

router.post("/", islogin, validateListing , wrapAsync(async (req,res)=>{
    let {title, description, image, price, country, location} = req.body;

    let imageUrl = image && image.trim() ? image.trim() : "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60";

    let newListing = new Listing({
        title,
        description,
        image: {
            filename: "listingimage",
            url: imageUrl
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
        
    
}));

//edit route

router.get("/:id/edit",islogin,isOwner , wrapAsync(async (req,res)=>{
    let {id}=req.params
     const listing=await Listing.findById(id);
      if(!listing){
          // Render the listings index directly with an inline error message
          const allListings = await Listing.find({});
          res.locals.error = ["Listing Not Found !"];
          return res.render("./listings/index.ejs", { allListings });
      }
     res.render("./listings/update.ejs",{listing})
}))

//update route

router.put("/:id",islogin,isOwner,validateListing, wrapAsync( async(req,res)=>{
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
        req.flash("success","Listing Updated !")
        return req.session.save(() => {
            res.redirect("/listings");
        });
})
)

//destroy route

router.delete("/:id", islogin,isOwner, wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id)
    req.flash("success","Listing Deleted !")
    return req.session.save(() => {
        res.redirect("/listings");
    });
})
);



module.exports = router;