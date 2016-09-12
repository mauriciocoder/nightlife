var express = require("express");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
// Forbidden to change stack order!!!
var flash = require("connect-flash");
app.use(flash());

// Mongoose Config
var mongoose = require("mongoose");
var dbUrl = process.env.NIGHTLIFE_APP_DB_URL;
mongoose.connect(dbUrl);

// Configuring passport
var passport = require("passport");
var expressSession = require("express-session");
// TODO - Why Do we need this key ?
app.use(expressSession({secret: "MySecretKey"}));
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

// Mustache Config
var mustacheExpress = require("mustache-express");
app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(express.static('public'));

//app.use(require('./middlewares/users'))
app.use(require("./controllers")(passport));

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log("dbUrl = " + dbUrl);
    console.log("Nightlife Listening on port " + port);
});