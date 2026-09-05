// Compatibility shim: replace deprecated util.isArray with Array.isArray to
// avoid deprecation warnings from older dependencies that still call it.
try {
    const util = require('util');
    if (typeof util.isArray !== 'function' || util.isArray !== Array.isArray) {
        util.isArray = Array.isArray;
    }
} catch (e) {
    // ignore if util cannot be required for some reason
}

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
// Suppress repetitive util.isArray deprecation (DEP0044) temporarily
const _origEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
    try {
        const msg = typeof warning === 'string' ? warning : (warning && warning.message) || '';
        if (msg && msg.includes('util.isArray')) return;
    } catch (e) {}
    return _origEmitWarning.call(process, warning, ...args);
};
const path=require("path")
// Compatibility shim: replace deprecated util.isArray with Array.isArray to
// avoid deprecation warnings from older dependencies that still call it.
try {
    const util = require('util');
    if (typeof util.isArray !== 'function' || util.isArray !== Array.isArray) {
        util.isArray = Array.isArray;
    }
} catch (e) {
    // ignore if util cannot be required for some reason
}
const Listing=require("./models/listing.js");
const Review=require("./models/review.js");
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

// Router requires will be loaded after app locals are configured
let listingsRouter;
let reviewsRouter;
let userRouter;

//reqire validating esantials///////////
const { validateListing, validateReview } = require("./public/validate.js");

const wrapAsync = require("./utils/wrapAsync.js")

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate);

// Make maptiler API key available to views
app.locals.maptilerApiKey = process.env.MAPTILER_API_KEY || '';

// Now require routers (after dotenv has been loaded and app.locals set)
listingsRouter = require("./routes/listing.js");
reviewsRouter = require("./routes/review.js");
userRouter = require("./routes/user.js");

main().then(()=>{
    console.log("mongodb is connected !")
}).catch(err=>{
    console.log(err)
});

async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderLust')
};

const sessionOptions={
    secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie:{
        expires: new Date(Date.now() + 7*24*60*60*1000),
      httpOnly: true,
      maxAge: 7*24* 60*60*1000
    }
}

app.use(session(sessionOptions));
app.use(flash()); 

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
})

// app.get("/fakeUser", async (req,res)=>{
//     const user = new User({ email: 'fake@example.com',
//         username: 'fakeUser' });
//     const newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// });         
     


app.use("/listings", listingsRouter)
app.use("/listings/:id/reviews", reviewsRouter)
app.use("/", userRouter)






// app.get("/testListing", async (req,res)=>{
//     let sampleListing= new Listing({
//         title: "bhanugadh villa",
//         description: "it is private villa for sale" ,
//         price: 20000000,
//         location: "rajsthan",
//         country: "india"

//     })

//     await sampleListing.save()
//     console.log("data save")
//     res.send("all done")
// });  

app.get("/",(req,res)=>{
    res.send("all done")
});

app.use((req,res,next)=>{
    res.status(404).render("./listings/error.ejs", {
        message: "Oops, page not found!",
        statusCode: 404
    });
})

app.use((err,req,res,next)=>{
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("./listings/error.ejs", {
        message,
        statusCode
    });
});

 const port=8080;
 app.listen(port,(req,res)=>{
    console.log(`server is running on port:${port}`)
 });