const express = require('express');
const router = express.Router();
const User = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { islogin } = require('../islogin');
const { saveRedirectUrl } = require('../islogin');



router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs")
})
router.post("/signup", wrapAsync(async (req,res,next)=>{
    try {
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome to Obsidia!");
            req.session.save(() => res.redirect("/listings"));
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

router.get("/login",(req,res)=>{
    const redirectTo = req.query.redirectTo || res.locals.redirectUrl || '';
    res.render("users/login.ejs", { redirectTo });
})

router.post("/login",
    saveRedirectUrl,
    passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
        req.flash("success", "Welcome Back to Obsidia !");
        const redirectUrl = (req.body && req.body.redirectTo) || (req.query && req.query.redirectTo) || (req.session && req.session.redirectUrl) || '/listings';
        if (req.session) delete req.session.redirectUrl;
        req.session.save(() => res.redirect(redirectUrl));
    }
);

router.get("/logout", wrapAsync(async (req,res)=>{
    req.logout((err)=>{
        if(err){req.flash("error",err.message);
        return res.redirect("/listings");}else{
            req.flash("success","Logged Out Successfully !")
            res.redirect("/listings");
        }})}));





module.exports = router;