const express = require('express');
const router = express.Router();
const User = require('../models/user');
const wrapAsync = require('../utils/wrapAsync');
const passport = require('passport');
const { islogin } = require('../islogin');
const { saveRedirectUrl } = require('../islogin');
const userController = require('../controllers/users.js');

router.route("/signup")
.get(userController.rendersignUpForm)
.post(wrapAsync(userController.signup));

router.route("/login").get(userController.renderLoginForm);

// Ensure the login controller runs after successful passport authentication
router.post('/login', saveRedirectUrl, passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), userController.login);


router.get("/logout", wrapAsync(userController.logout));


module.exports = router;