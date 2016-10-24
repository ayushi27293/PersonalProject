/**
 * Created by AyushiDesai on 10/14/16.
 */

/**
 * Created by Ayushidesai on 10/14/16.
 */

var express = require('express'), // Using the express module to create the server
    OAuth = require('oauth').OAuth, // Using OAuth Node.JS module to get the authentication token from LinkedIn
// Setup the Express.js server
    app = express();
var logger = require('morgan');
app.use(logger('dev'));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var cookieParser = require('cookie-parser');
app.use(cookieParser);
var session = require('express-session');
app.use(session({secret: "3hnYcl2LDVQ6VT8f",
    resave: "",
    saveUninitialized: ""}));
//Root page
app.get('/', function(req, res){
    if(!req.session.oauth_access_token) {
        //If the user does not have the OAuth access token then redirect the response to another url
        res.redirect("/linkedin_login");
    }
});

// Request an OAuth Request Token, and redirects the user to authorize it
app.get('/linkedin_login', function(req, res) {
    var getRequestTokenUrl = "https://api.linkedin.com/uas/oauth/requestToken?scope=r_network";
    var oa = new OAuth(getRequestTokenUrl,
        "https://api.linkedin.com/uas/oauth/accessToken",
        "<<81e57bl2ssjlec>>",
        "<<3hnYcl2LDVQ6VT8f>>",
        "1.0",
        "https://ayushiaouth.herokuapp.com/linkedin_callback"+( req.param('action') && req.param('action') != "" ? "?action="+querystring.escape(req.param('action')) : "" ), // the callback url where LinkedIn OAuth secret token will be sent

        "HMAC-SHA1");

    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
        if(error) {
            console.log('error');
        }
        else {
            // store the tokens in the session
            req.session.oa = oa;
            req.session.oauth_token = oauth_token;
            req.session.oauth_token_secret = oauth_token_secret;


            // redirect the user to authorize the token                                                  res.redirect("https://www.linkedin.com/uas/oauth/authorize?oauth_token="+oauth_token);
        }
    })
});

// Callback for the authorization page
app.get('/linkedin_callback', function(req, res) {
    // get the OAuth access token with the 'oauth_verifier' that we received
    req.session.oauth_token.verifier = req.param('oauth_verifier');

    var oa = new OAuth(req.session.oa._requestUrl,
        req.session.oa._accessUrl,
        req.session.oa._consumerKey,
        req.session.oa._consumerSecret,
        req.session.oa._version,
        req.session.oa._authorize_callback,
        req.session.oa._signatureMethod);
    console.log(oa);

    oa.getOAuthAccessToken(
        req.session.oauth_token,
        req.session.oauth_token_secret,
        req.param('oauth_verifier'),
        function(error, oauth_access_token, oauth_access_token_secret, results)    {
            if(error) {
                console.log('error');
            }
            else {

                // store the access token in the session
                req.session.oauth_access_token = oauth_access_token;
                req.session.oauth_access_token_secret = oauth_access_token_secret;

                res.redirect("https://www.linkedin.com/uas/oauth/authenticate?oauth_token=" + oauth_access_token);
                //res.redirect((req.param('action') && req.param('action') != "") ? req.param('action') : "/linkedin_track");
            }
        });
});

app.get('/linkedin_track', function(req, res) {
    var oa = new OAuth(req.session.oa._requestUrl,
        req.session.oa._accessUrl,
        req.session.oa._consumerKey,
        req.session.oa._consumerSecret,
        req.session.oa._version,
        req.session.oa._authorize_callback,
        req.session.oa._signatureMethod);
    console.log(oa);

    oa.getProtectedResource(

        //Calling the people search api to know who are my connections who directly or indirectly are connected to Azure
        "http://api.linkedin.com/v1/people-search?keywords=praviinm",
        "GET",
        req.session.oauth_access_token,
        req.session.oauth_access_token_secret,
        function (error, data, response) {
            //var feed = JSON.parse(data);
            res.send(data);
        });
});
app.listen(3000);
console.log("listening on https://ayushiaouth.herokuapp.com/");
