const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");
const { validateReview } = require("../public/validate");
const wrapAsync = require("../utils/wrapAsync");
const { islogin,isOwner, isReviewOwner } = require("../islogin");
const reviewController = require("../controllers/reviews");

// review POST (mounted at /listings)
router.post("/", validateReview, islogin, wrapAsync(reviewController.createReview));

// review DELETE (mounted at /listings)
router.delete("/:reviewId", islogin, isReviewOwner, wrapAsync(reviewController.destroyReview));

module.exports = router;