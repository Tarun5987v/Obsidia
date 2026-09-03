const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");
const { validateReview } = require("../public/validate");
const wrapAsync = require("../utils/wrapAsync");
const { islogin,isOwner, isReviewOwner } = require("../islogin");

// review POST (mounted at /listings)
router.post("/", validateReview, islogin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        const err = new Error("Listing not found");
        err.statusCode = 404;
        throw err;
    }
    const newReview = new Review({
        rating: Number(req.body.rating),
        comment: req.body.comment,
        author: req.user._id
    });
    // save review first, then add its id to the listing and save listing
    const result = await newReview.save();
    listing.reviews.push(result._id);
    const savedListing = await listing.save();
    req.flash("success","Review Added !");
    res.redirect(`/listings/${listing._id}`);
}));

// review DELETE (mounted at /listings)
router.delete("/:reviewId", islogin, isReviewOwner, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted !")
    res.redirect(`/listings/${id}`);
}));

module.exports = router;