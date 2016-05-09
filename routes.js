var User = require('./users.js');
var mongo = require('mongodb');
//var configAuth = require('./auth.js') ttaco

require('./passport.js');
module.exports = function(app, passport) {

    app.get('/', function(req, res) {
        res.render('index.ejs', {
            user: req.user
        });
    });
    app.get('/newpoll', isLoggedIn, function(req, res) {
        //get poll number
        res.render('newpoll.ejs', {
            user: req.user
        });
    });
    app.get('/newpollsucess', isLoggedIn, function(req, res) {
        //get poll number
        res.render('newpollsucess.ejs', {
            user: req.user
        });
    });

  app.post('/newpoll/submit/', isLoggedIn, function(req, res) {


mongo.connect(process.env.MONGOLAB_URI,function(err,db){
var pollNumber = db.collection("VoteApp").findOne({"countOfPolls"}, {_id: 0});
    elementsArray = req.body.elements;
    var breakTheElementsApartIntoArray = elementsArray.split(",");
    var mongoPoll = {};
    for (var i=0, len = breakTheElementsApartIntoArray.length; i<len; i++) {
      mongoPoll[breakTheElementsApartIntoArray[i].trim()] = 0;
    }
    db.collection("VoteApp").insert({username: req.user.facebook.name, title: req.body.title, poll: mongoPoll});
    res.render('newpollsucess.ejs', {
        user: req.user
    });
});

  });

    app.get('/managepolls', isLoggedIn, function(req, res) {
        //get poll number
        res.render('managepolls.ejs', {
            user: req.user
        });
    });
    // /poll is where you can view a poll
    app.get('/poll', isLoggedIn, function(req, res) {
        //get poll number
        res.render('managepolls.ejs', {
            user: req.user
        });
    });

    // /pollmanage is where a user can edit their poll
    app.get('/pollmanage', isLoggedIn, function(req, res) {
        //get poll number
        res.render('managepolls.ejs', {
            user: req.user
        });
    });

    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}
