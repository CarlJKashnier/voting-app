var User = require('./users.js');
var mongo = require('mongodb');
//var configAuth = require('./auth.js') ttaco

require('./passport.js');
module.exports = function(app, passport) {

    app.get('/', function(req, res) {
      mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
          db.collection("VoteApp").find({
            "pollID": {$gt : 1}
          }, {
              "_id": 0
          }).limit(50).sort({
              "pollID": -1
          }).toArray(function(err, dataset) {
              console.log(dataset);

              res.render('index.ejs', {
                  user: req.user,
                  stuffToRender: dataset
              });
          });
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
//Add more elements to an existing poll
app.post('/pollAdd/', isLoggedIn, function(req, res) {
  var rawStuff = req.body.AddStuff.split(":");
  var pollCheck = parseInt(rawStuff[0]);
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        db.collection("VoteApp").update({
            "pollID": pollCheck
        }, { $set:  {["poll." req.body.stuffToBeAdded.toString() : 0 }
      },function(err,data){
        res.redirect(301, '/managepolls');
      });

    });

});
    //This removes a post, checks that use user is deleteing their own poll with the req.user.facebook.id - Then redirects back to the Manage Polls page.
    app.post('/pollDel/', isLoggedIn, function(req, res) {
        var rawStuff = req.body.DelStuff.split(":");
        var pollCheck = parseInt(rawStuff[0]);
        mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
            db.collection("VoteApp").remove({
              "userid":req.user.facebook.id,
                'pollID': pollCheck
            }, {
                justOne: true
            });
            res.redirect(301, '/managepolls');
        });
    });

//This will add a new poll from the client
    app.post('/newpoll/submit/', isLoggedIn, function(req, res) {
        mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
            db.collection("VoteApp").findOne({
                countOfPolls: {
                    $gt: 0
                }
            }, {
                _id: 0
            }, function(err, pollNumber) {
                elementsArray = req.body.elements;
                var breakTheElementsApartIntoArray = elementsArray.split(",");
                var mongoPoll = {};
                for (var i = 0, len = breakTheElementsApartIntoArray.length; i < len; i++) {
                    mongoPoll[breakTheElementsApartIntoArray[i].trim()] = 0;
                }
                db.collection("VoteApp").insert({
                    username: req.user.facebook.name,
                    userid: req.user.facebook.id,
                    title: req.body.title,
                    poll: mongoPoll,
                    pollID: pollNumber.countOfPolls + 1
                });
                db.collection("VoteApp").updateOne({
                    "countOfPolls": {
                        $gt: 0
                    }
                }, {
                    $inc: {
                        "countOfPolls": 1
                    }
                });
                res.render('newpollsucess.ejs', {
                    user: req.user,
                    pollNum: pollNumber.countOfPolls + 1
                });
            });
        });
    });

// Process the allowed vote from the poll
    app.post('/pollVote/', function(req, res) {
        var breakApart = req.body.Item;
        breakApart = breakApart.split("|");
        var pollb = parseInt(breakApart[1]);
        var vote = breakApart[0];
        //console.log(req.body);

        mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
            console.log(pollb + " " + vote);
            var ip = req.ip.split(":");
            ip = ip[3];
            db.collection("VoteApp").updateOne({
                "pollID": pollb
            }, {
                $inc: {
                  //I can't figure out any other way to do this is ES5.
                    ["poll." + vote]: 1
                }
            }, function(err) {
                if (err) {
                    throw err;
                } else {
                    console.log("sucess");
                }
            });
            db.collection('voters').insert({
                "ip": ip,
                "poll": pollb
            });
            db.collection("VoteApp").findOne({
                "pollID": pollb
            }, {
                _id: 0
            }, function(err, polldata) {
                if (err || polldata === undefined || polldata === null) {
                    res.render('noPoll.ejs', {
                        user: req.user,
                    });
                    return;
                } else {
                    res.redirect(301, '/poll/' + pollb);
                }
            });

        });
    });

//Manage polls, gather all polls, sort highest poll number to lowest, for user then send to EJS for rendering
    app.get('/managepolls', isLoggedIn, function(req, res) {
        mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
            db.collection("VoteApp").find({
                "userid": req.user.facebook.id.toString()
            }, {
                "_id": 0
            }).limit(50).sort({
                "pollID": -1
            }).toArray(function(err, dataset) {
                console.log(dataset);

                res.render('managepolls.ejs', {
                    user: req.user,
                    stuffToRender: dataset
                });
            });
        });
    });

//find voter's ip, verify the have not voted, if not, let vote, else show table of results. if they vote send back to page and show chart.
    app.get('/poll/*', function(req, res) {
        var vote = false;
        var ip = req.ip.split(":");
        ip = ip[3];
        console.log(ip);
        var pollNum = parseInt(req.params[0]);
        mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
            db.collection('voters').findOne({
                'ip': ip,
                "poll": pollNum
            }, {
                _id: 0
            }, function(err, dataset) {
                db.collection("VoteApp").findOne({
                    "pollID": pollNum
                }, {
                    _id: 0
                }, function(err, polldata) {
                    if (err || polldata === undefined || polldata === null) {
                        res.render('noPoll.ejs', {
                            user: req.user,
                        });
                        return;
                    } else {
                        if (dataset === null) {

                            res.render('poll.ejs', {
                                user: req.user,
                                polldata: polldata,
                                votedata: false
                            });
                        } else {
                            var result = [];
                            console.log(polldata.poll);
                            for (var i in polldata.poll)
                                result.push([i, polldata.poll[i]]);
                            console.log(result);
                            res.render('poll.ejs', {
                                user: req.user,
                                polldata: polldata,
                                votedata: true,
                                chartData: result
                            });
                        }
                    }
                });
            });
        });
    });
//Where the user lands after login I am going to do away with this and forward to managepolls
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/managepolls',
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
