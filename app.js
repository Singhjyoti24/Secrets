//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/loginDB");
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    User.find({ "secret": { $ne: null } }).then(function (foundUsers) {
        if (foundUsers) {
            res.render("secrets", { usersWithSecrets: foundUsers });
        }
    })
})

app.get("/logout", function (req, res) {
    res.logout();
    res.redirect("/")
})

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (user) {
        if (user) {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        } else {
            res.redirect("/register");
        }
    })
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (!err) {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    })
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const secret = req.body.secret;

    User.findById(req.user.id).then(function (foundUser) {
        if (foundUser) {
            foundUser.secret = secret;
            foundUser.save();
            res.redirect("/secrets");
        }
    })
})



app.listen(3000, function () {
    console.log("Server started on port 3000!")
});
