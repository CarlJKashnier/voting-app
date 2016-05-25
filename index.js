var dotenv = require('dotenv').config();
var sanitize = require('sanitize-caja');
var express = require('express');
var app = express();
var mongo = require('mongodb');
var passport = require('passport');
var mongoose = require('mongoose');
var morgan = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongostore')(session);

require('./passport.js');

mongoose.connect(process.env.MONGOLAB_URI);
//Add line taco test test

//require('./routes.js');


app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    cookie: {
        maxAge: 691200000
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection
      }),
    secret: 'anystringoftext',
    saveUninitialized: true,
    resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
require('./routes.js')(app, passport);
require('./passport.js')(passport);


var server = app.listen(process.env.PORT || 8888);
console.log("Server running on port: " + (process.env.PORT || 8888));
//Seeing if Git works
