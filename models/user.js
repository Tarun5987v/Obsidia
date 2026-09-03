const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// Support CommonJS or ESM default export shape
const plmPlugin = passportLocalMongoose && passportLocalMongoose.default ? passportLocalMongoose.default : passportLocalMongoose;
userSchema.plugin(plmPlugin);

module.exports = mongoose.model('User', userSchema);