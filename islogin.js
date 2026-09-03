const Listing = require("./models/listing");
const Review = require("./models/review");


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
