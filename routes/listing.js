if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}




const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const Review = require("../models/review");
const { validateListing, validateReview } = require("../public/validate");
const wrapAsync = require("../utils/wrapAsync");
const { islogin,isOwner } = require("../islogin");
const listingController = require("../controllers/listings");

const multer  = require('multer')
const { storage } = require('../cloudconfig');
const upload = multer({storage})



router.route("/")
.get(wrapAsync(listingController.index))//index route
.post(
  islogin,
  upload.single('image'),
  validateListing,
  wrapAsync(listingController.createListing)); // create route



// new route
router.get("/new",islogin,listingController.renderNewForm);


router.route("/:id")
.get(wrapAsync(listingController.showListing))//show route
.put(
    islogin,
    isOwner,
  upload.single('image'),
  validateListing,
    wrapAsync(listingController.updateListing))//update route 
  .delete(
    islogin,
    isOwner,
    wrapAsync(listingController.distroyListing)
  );//destroy route 



//edit route

router.get("/:id/edit",islogin,isOwner , wrapAsync(listingController.editListing));





module.exports = router;