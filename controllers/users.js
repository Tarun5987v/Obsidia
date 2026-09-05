const User = require("../models/user");

module.exports.rendersignUpForm = (req,res)=>{
    res.render("users/signup.ejs")
}

module.exports.signup = async (req,res,next)=>{
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
}

module.exports.renderLoginForm = (req,res)=>{
    const redirectTo = req.query.redirectTo || res.locals.redirectUrl || '';
    res.render("users/login.ejs", { redirectTo });
}

module.exports.login = (req, res) => {
        req.flash("success", "Welcome Back to Obsidia !");
        const redirectUrl = (req.body && req.body.redirectTo) || (req.query && req.query.redirectTo) || (req.session && req.session.redirectUrl) || '/listings';
        if (req.session) delete req.session.redirectUrl;
        req.session.save(() => res.redirect(redirectUrl));
    }

    module.exports.logout = async (req,res)=>{
    req.logout((err)=>{
        if(err){req.flash("error",err.message);
        return res.redirect("/listings");}else{
            req.flash("success","Logged Out Successfully !")
            res.redirect("/listings");
        }})}