var express = require("express");
var router = express.Router();
//var Poll = require("../models/poll");

/* require the modules needed */
var oauthSignature = require("oauth-signature");  
var n = require("nonce")();  
var request = require("request");  
var qs = require("querystring");  
var _ = require("lodash");

function callYelp(searchLocation, callback) {
    var httpMethod = "GET";
    var url = 'http://api.yelp.com/v2/search';
    
    var filter_parameters = {
        location: searchLocation,
        category_filter: "bars",
        sort: '2'
    };
    
    var required_parameters = {
        oauth_consumer_key : process.env.OAUTH_CONSUMER_KEY,
        oauth_token : process.env.OAUTH_TOKEN,
        oauth_nonce : n(),
        oauth_timestamp : n().toString().substr(0,10),
        oauth_signature_method : "HMAC-SHA1",
        oauth_version : "1.0"
    };
    var parameters = _.assign(required_parameters, filter_parameters);
    
    var consumerSecret = process.env.CONSUMER_SECRET;
    var tokenSecret = process.env.TOKEN_SECRET;
    
    /* Then we call Yelp's Oauth 1.0a server, and it returns a signature */
    /* Note: This signature is only good for 300 seconds after the oauth_timestamp */
    var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});
    
    /* We add the signature to the list of paramters */
    parameters.oauth_signature = signature;
    
    /* Then we turn the paramters object, to a query string */
    var paramURL = qs.stringify(parameters);
    
    /* Add the query string to the url */
    var apiURL = url + '?' + paramURL;
    console.log("url = " + apiURL);
    
    /* Then we use request to send make the API Request */
    request(apiURL, function(error, response, body) {
        return callback(error, response, body);
    });
}

module.exports = function() {
    /* Handle search POST */
    router.post("/", function(req, res) {
        var town = req.body.town;
        callYelp(town, function(error, response, body) {
            // TODO: Handle error response
            var results = JSON.parse(body);
            var resContent = { user: req.user, authenticated: req.isAuthenticated() };
            resContent.businesses = results.businesses;
            //console.log("body = " + JSON.stringify(body));
            res.render("home", resContent);
            
        });
        //Poll.find({}, handlePollsView.bind(null, req, res));
    });
    return router;
};
/*
function handlePollsView(req, res, err, polls) {
    var resContent = { user: req.user, authenticated: req.isAuthenticated() };
    var userPolls = [];
    var allPolls = [];
    if (resContent.authenticated) {
        for (var i = 0; i < polls.length; i++) {
            if (polls[i].author == resContent.user.id) {
                userPolls.push(polls[i]);
            } else {
                allPolls.push(polls[i]);
            }
        }
    } else {
        allPolls = polls;
    }
    resContent.userPolls = userPolls;
    resContent.allPolls = allPolls;
    resContent.message = req.flash("message");
    res.render("polls", resContent);
}
*/
