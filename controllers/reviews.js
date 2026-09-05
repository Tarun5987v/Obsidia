const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
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
}

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted !")
    res.redirect(`/listings/${id}`);
}