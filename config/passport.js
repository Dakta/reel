
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose');
// var LocalStrategy = require('passport-local').Strategy;

var Profile = mongoose.model('Profile');

/*
var local = require('./passport/local');
var google = require('./passport/google');
*/
var facebook = require('./passport/facebook');
var twitter = require('./passport/twitter');
/*
var linkedin = require('./passport/linkedin');
var github = require('./passport/github');
*/

/**
 * Expose
 */

module.exports = function (passport, config) {
/*
  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(id, done) {
    User.load({ criteria: { _id: id } }, function (err, user) {
      done(err, user)
    })
  })
*/

    // passport config
    // serialize and deserialize
    passport.serializeUser(function(user, done) {
//         console.log('serializeUser: ' + user._id);
        return done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
//         console.log('deserializing '+id);
        
        Profile.findById(new mongoose.Types.ObjectId(id), function(err, user){
//             console.log('deserialize', user);
            if (!err) {
                return done(null, user);
            } else {
                console.log('deserialize err: '+err);
                return done(err, null);
            }
        });
    });


  // use these strategies
//   passport.use(local);
//   passport.use(google);
    passport.use(facebook);
    passport.use(twitter);
/*
  passport.use(linkedin);
  passport.use(github);
*/
};