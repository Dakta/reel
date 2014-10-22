
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config');
var Account = mongoose.model('Account');
var Profile = mongoose.model('Profile');

/**
 * Expose
 */

module.exports = new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
        if (!req.user) {
            // Not logged in, so authenticate new account
            
            Account.findOne({ provider: 'facebook', provider_id: profile.id }, function(err, account) {
                if (err) { console.log('Account.findOne', err); }
                if (!err && account != null) {
                    // existing account, try to log in
                    
                    Profile.findOne({ accounts: account._id }, function(err, site_profile) {
                        if (err) { console.log('Profile.findOne', err); }
                        if (!err && profile != null) {
                            // found our profile; pass it back to serializeUser
/*                             console.log('found profile'); */
                            return done(null, site_profile); // pass site_profile back to serializeUser
                        } else {
                            // shit? (account with no profile) make them try again
                            var error_msg = 'err: found account without profile; aborting';
/*                             console.log(error_msg); */
                            Account.remove({ _id: account._id }, function(err) {
                                if (err) {
                                    console.log('Account.remove', err);
                                } else {
                                    console.log('deleted '+account.provider+' account '+account.provider_id);
                                }
                                return done(error_msg);
                            });
                        }
                    });
                } else {
                    // new user; create account and profile
                    
                    var account = new Account({
                        provider: 'facebook',
                        provider_id: profile.id,
                        created: Date.now()
                    });
                    
                    account.save(function(err) {
                        if (err) {
                            console.log('Account.save', err);
                        } else {
                            // make them a profile
                            console.log("saving user ...");
                            var site_profile = new Profile({
                                display_name: profile.displayName,
                                avatar_url: profile._json.profile_image_url,
                                provider_profile: profile
                            });
                            site_profile.accounts.push(account._id); // attach the access account we just created to this "user account" aka profile
                            site_profile.save(function(err) {
                                if (err) { console.log(err); }
                                return done(null, site_profile); // pass site_profile back to serializeUser
                            })
                        }
                    });
                };
            });
            
        } else {
            // Logged in. Associate account with user.  Preserve the login
            // state by supplying the existing user after association:
            // return done(null, req.user);
            
            Account.findOne({ provider: 'facebook', provider_id: profile.id }, function(err, account) {
                if (err) { console.log('Account.findOne', err); }
                if (!err && account == null) {
                    // good, no account already
                    
                    Profile.findById(req.user._id, function(err, site_profile) {
                        if (err) { console.log('Profile.findById', err); }
                        if (!err && site_profile != null) {
                            console.log('found profile');
                            // now attach this provider account to this profile

                            var account = new Account({
                                provider: 'facebook',
                                provider_id: profile.id,
                                created: Date.now()
                            });
                            account.save(function(err) {
                                if (err) {
                                    console.log('Account.save', err);
                                } else {
                                    // connect the account to the profile
                                    console.log("saving user ...");
                                    site_profile.accounts.push(account._id); // attach the access account we just created to this "user account" aka profile
                                    site_profile.save(function(err) {
                                        if (err) { console.log(err); }
                                        return done(null, site_profile); // pass site_profile back to serializeUser
                                    })
                                }
                            });        
                        } else {
                            // shit? (logged in user with no profile) make them try again
                            var error_msg = 'err: found logged in user without profile; aborting';
                            console.log(error_msg);
                            
                            console.log("Force LOGGIN OUT " + req.user.display_name);
                            req.logout();
                            req.session.notice = "You have been logged out, " + name + ".";
                            return done(null, req.user);
                        }
                    });
                } else {
                    // account already exists on site
                    // either it's attached to current user or to someone else
                    
                    req.session.notice = "That account is already connected to a profile.";
                    return done("Account already in use.", null);
                }
            });
            
        }
    }
);
