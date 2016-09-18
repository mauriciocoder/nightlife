var express = require("express");
var router = express.Router();
var Visitor = require("../models/visitor");

var oauthSignature = require("oauth-signature");  
var n = require("nonce")();  
var request = require("request");  
var qs = require("querystring");  
var _ = require("lodash");

function callYelpAPI(searchLocation, callback) {
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
    
    /* Then we use request to send make the API Request */
    request(apiURL, function(error, response, body) {
        return callback(error, response, body);
    });
}

module.exports = function() {
    /* Handle search POST */
    router.post("/", function(req, res) {
        var town = req.body.town;
        callYelpAPI(town, function(error, response, body) {
            // TODO: Handle error response
            var results = JSON.parse(body);
            var resContent = { user: req.user, authenticated: req.isAuthenticated() };
            // TODO: UNAVAILABLE_FOR_LOCATION
            if (results.error) {
                if (results.error.id === "UNAVAILABLE_FOR_LOCATION") {
                    req.flash("message", "We ain't got data for this town yet");
                    return res.redirect("/");
                }
            }
            resContent.businesses = results.businesses;
            var pubIds = [];
            for (var i = 0; i < resContent.businesses.length; i++) {
                pubIds.push(resContent.businesses[i].id);
                resContent.businesses[i].visitorsQty = 0;
            }
            Visitor.find({pubId : {$in : pubIds}}, function(err, visitors) {
                if (err) {
                    throw err;
                }
                if (req.isAuthenticated()) {
                    for (var j = 0; j < visitors.length; j++) {
                        for (var i = 0; i < resContent.businesses.length; i++) {
                            if (resContent.businesses[i].id == visitors[j].pubId) {
                                resContent.businesses[i].visitorsQty += 1;
                                if (visitors[j].username == req.user.username) {
                                    resContent.businesses[i].userIsAVisitor = true;
                                }
                            }
                        }
                    }    
                }
                var session = req.session;
                session.businesses = resContent.businesses;
                res.render("home", resContent);
            });
        });
    });
    return router;
};
