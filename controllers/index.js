var express = require("express");
var router = express.Router();
module.exports = function(passport) {
    router.get("/", function(req, res) {
        console.log("Chegou na raiz!");
        //res.redirect("/polls");
    });

    /* Handle Logout */
	router.get("/logout", function(req, res) {
		req.logout();
		res.redirect("/");
	});
    router.use("/login", require("./login")(passport));
    router.use("/register", require("./register")(passport));
    /*
    router.use("/polls", require("./polls")());
    router.use("/poll", require("./poll")());
    router.use("/answer", require("./answer")());
    */
    return router;
}
