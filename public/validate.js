// regex for ("/listings/new")
const titleRegex = /^[a-zA-Z0-9\s\-]{3,100}$/;
const locationRegex = /^[a-zA-Z\s\-,]{2,}$/;
const priceRegex = /^\d+(\.\d{1,2})?$/;

function validateNewListing(req, res, next) {
   const { title, description, price, country, location } = req.body;

   if (!title || !titleRegex.test(title.trim())) {
      const err = new Error("Invalid title");
      err.statusCode = 400;
      return next(err);
   }
   if (!description || description.trim().length < 10) {
      const err = new Error("Description should be at least 10 characters");
      err.statusCode = 400;
      return next(err);
   }
   if (!price || !priceRegex.test(price.toString())) {
      const err = new Error("Invalid price");
      err.statusCode = 400;
      return next(err);
   }
   if (!country || !country.trim() || !location || !location.trim()) {
      const err = new Error("Country and location are required");
      err.statusCode = 400;
      return next(err);
   }
   if (!locationRegex.test(location.trim())) {
      const err = new Error("Invalid location");
      err.statusCode = 400;
      return next(err);
   }

   next();
}

function validateReview(req, res, next) {
  const { rating, comment } = req.body;

  if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
    const err = new Error("Rating must be between 1 and 5");
    err.statusCode = 400;
    return next(err);
  }

  if (!comment || comment.trim().length < 3) {
    const err = new Error("Comment must be at least 3 characters");
    err.statusCode = 400;
    return next(err);
  }

  if (comment.trim().length > 500) {
    const err = new Error("Comment is too long");
    err.statusCode = 400;
    return next(err);
  }

  req.body.comment = comment.trim();
  next();
}

module.exports = {
  validateListing: validateNewListing,
  validateReview
};