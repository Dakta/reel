var express = require('express');

// var http = require('http').Server(app);
var config = require('./oauth.js');
var redisConfig = require('./redis.js');
var passport = require('passport');
var passportSocketIo = require("passport.socketio");
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// simpleflake for UID generation (profiles, content)
var flake = require('simpleflake');
// generation util to produce 
var flakeGen = function() {
    return flake().toString('base58');
};


// connect to database
var mongoose = require('mongoose'),
    mongoURI = process.env.MONGOLAB_URI || 'oops'; // fallback is dangerous, make failure obvious

var paginator = require('mongoose-paginator');

// mongoose does this async, which is nice
mongoose.connect(mongoURI, function(err, res) {
    if (err) {
        console.log ('ERROR connecting to: ' + mongoURI + '. ' + err);
    } else {
        console.log ('Succeeded connected to: ' + mongoURI);
    }
});


// account schema
var accountSchema = new mongoose.Schema({
    provider: String, // currently one of 'twitter' or 'email'
    provider_id: Number, // oauthID or email address
    created: Date
});
// and model
var Account = mongoose.model('Account', accountSchema);

// profile schema
var profileSchema = new mongoose.Schema({
/*     uid: { type: String, default: flakeGen }, // we generate this with simpleflake, conv buffer to base58 string */
    display_name: String, // for now, we're not picky
    avatar_url: String,
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
    provider_profile: Object
});
// pagination defaults
profileSchema.plugin(paginator, {
    limit: 50,
    defaultKey: '_id',
    direction: 1
});
// and model
var Profile = mongoose.model('Profile', profileSchema);


// passport config
// serialize and deserialize
passport.serializeUser(function(user, done) {
/*     console.log('serializeUser: ' + user._id) */
    done(null, user._id);
});
passport.deserializeUser(function(id, done) {
/*     console.log('deserializing '+id); */
    
    Profile.findById(new mongoose.Types.ObjectId(id), function(err, user){
        console.log('deserialize', user);
        if (!err) {
            done(null, user);
        } else {
            console.log('deserialize err: '+err);
            done(err, null);
        }
    });
});

// strategies
passport.use(
    new TwitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: config.twitter.callbackURL
    },
    function (accessToken, refreshToken, profile, done) {
        Account.findOne({ provider: 'twitter', provider_id: profile.id }, function(err, account) {
            if (err) { console.log('Account.findOne', err); }
            if (!err && account != null) {
                console.log('account', account);
                Profile.findOne({ accounts: account._id }, function(err, site_profile) {
                    if (err) { console.log('Profile.findOne', err); }
                    if (!err && profile != null) {
                        console.log('found profile');
                        done(null, site_profile); // pass site_profile back to serializeUser
                    } else {
                        // shit? (account with no profile) make them try again
                        var error_msg = 'err: found account without profile; aborting';
                        console.log(error_msg);
                        Account.remove({ _id: account._id }, function(err) {
                            if (err) {
                                console.log('Account.remove', err);
                            } else {
                                console.log('deleted '+account.provider+' account '+account.provider_id);
                            }
                            done(error_msg);
                        });
                    }
                });
            } else {
                console.log('new user');
                // new user!
                var account = new Account({
                    provider: 'twitter',
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
                            done(null, site_profile); // pass site_profile back to serializeUser
                        })
                    }
                });
            };
        });
    }
));
passport.use(
    new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL
    },
    function (accessToken, refreshToken, profile, done) {
        Account.findOne({ provider: 'facebook', provider_id: profile.id }, function(err, account) {
            if (err) { console.log('Account.findOne', err); }
            if (!err && account != null) {
                console.log('account', account);
                Profile.findOne({ accounts: account._id }, function(err, site_profile) {
                    if (err) { console.log('Profile.findOne', err); }
                    if (!err && profile != null) {
                        console.log('found profile');
                        done(null, site_profile); // pass site_profile back to serializeUser
                    } else {
                        // shit? (account with no profile) make them try again
                        var error_msg = 'err: found account without profile; aborting';
                        console.log(error_msg);
                        Account.remove({ _id: account._id }, function(err) {
                            if (err) {
                                console.log('Account.remove', err);
                            } else {
                                console.log('deleted '+account.provider+' account '+account.provider_id);
                            }
                            done(error_msg);
                        });
                    }
                });
            } else {
                console.log('new user');
                // new user!
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
                            avatar_url: "http://graph.facebook.com/"+profile.id+"/picture",
                            provider_profile: profile
                        });
                        site_profile.accounts.push(account._id); // attach the access account we just created to this "user account" aka profile
                        site_profile.save(function(err) {
                            if (err) { console.log(err); }
                            done(null, site_profile); // pass site_profile back to serializeUser
                        })
                    }
                });
            };
        });
    }
));


// sitewide session middleware config
var expressSession = require("express-session");
var redis = require('connect-redis')(expressSession);
var redisStore = new redis(redisConfig);
var sessionMiddleware = expressSession({
/*
    name: "COOKIE_NAME_HERE",
    secret: "COOKIE_SECRET_HERE",
    store: new (require("connect-mongo")(expressSession))({
        url: "mongodb://localhost/DATABASE_NAME_HERE"
    })
*/
    store: redisStore,
    secret: 'my_precious',
    cookieParser: express.cookieParser
});


// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    
    res.redirect('/auth')
}


// express config
var app = express();

app.configure(function() {
    app.set('port', (process.env.PORT || 5000));

    app.use(express.logger());
    app.use(express.cookieParser());
/*     app.use(express.session({ secret: 'my_precious' })); */
    app.use(sessionMiddleware);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(app.router);
    
    app.use('/css', express.static(__dirname + '/static/css'));
    app.use('/js', express.static(__dirname + '/static/js'));
    app.use('/img', express.static(__dirname + '/static/img'));
    app.use('/js/vendor', express.static(__dirname + '/bower_components'));
});


var server = app.listen(app.get('port'), function() {
    console.log('listening on '+app.get('port'));
});

var io = require('socket.io').listen(server);




// express routing
app.get('/', ensureAuthenticated, function(req, res) {
    console.log('got /');
    res.sendfile('index.html');
});

app.get('/account', ensureAuthenticated, function(req, res) {
    Profile.findById(req.session.passport.user, function(err, user) {
        if (err) {
            console.log('Profile.findById', err);
        } else {
            res.send(user);
        };
    });
});



app.get('/users', ensureAuthenticated, function(req, res) {
    console.log(req.params);
    
    var params = {};
    
    // from query string to mongoose-paginate params
    if (req.query.hasOwnProperty('after')
        && req.query.after != null
    ) {
        params.after = req.query.after;
    } else if (req.query.hasOwnProperty('before')
        && req.query.before != null
    ) {
        params.before = req.query.before
    }
/*     res.send(req.params); */

    Profile.paginate({ direction: params.direction}, '_id')
        .limit(params.limit) // overrides default limit, if set
        .execPagination(function(err, obj) {
            /** obj = {
                "perPage": 20, <= same as limit
                "thisPage": 2,
                "after": "52fb4cd4205626aceddc7127",
                "before": "52fb4cca546de0dd61469e20",
                "results": [{}, {}]
            } */
            res.send(obj);
        });

});


// profile
app.get('/users/:userid/:username?', ensureAuthenticated, function(req, res) {

    console.log(req.params);

    Profile.findById(req.params.userid, function(err, profile) {
        if (err) {
            console.log(err);
        } else {
            res.send(profile);
        }
    })
/*     res.sendfile('index.html'); */
});

app.get('/auth', function(req, res) {
    res.send('<html><a href="/auth/twitter">Twitter</a> or <a href="/auth/facebook">Facebook</a> or <a href="/auth/logout">log out</a>.</html>');
});

app.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {});
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/failed' }), function(req, res) {
    res.redirect('/');
});
app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res) {});
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/failed' }), function(req, res) {
    res.redirect('/');
});

app.get('/auth/logout', ensureAuthenticated, function(req, res) {
    var name = req.user.display_name;
    console.log("LOGGIN OUT " + name);
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out, " + name + "!";
});



// socket.io websocket stuff

// authentication middleware
/*
io.use(function(socket, next) {
    sessionMiddleware(socket.request, {}, next);
});
*/

// actual authentication
/*
io.use(function(socket, next) {
    console.log(socket.request);
    if (socket.request.session.hasOwnProperty('passport')) {
        var userId = socket.request.session.passport.user;
        console.log("Your User ID is", userId);
        next();
    } else {
        // we have no user
        socket.emit('error', 'Not authenticated.');
        socket.disconnect();
    }
});
*/


// authenticate
io.use(passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  secret:      'my_precious',    // the session_secret to parse the cookie
  store:       redisStore
}));

// list of online users
var users = [];

// connect
io.on('connection', function(socket){
    console.log('a user connected');

    // add user to connected list
/*     users[socket.request.user._id] = socket.request.user; */
    users.push(socket.request.user);
    
    // tell our user their own name (yeah)
    socket.emit('set_self', socket.request.user);
    
    // update online list for everyone
    function emitUserlist() {
        io.sockets.emit('userlist', [ { name: 'Online', data: users} ]);
    }
    emitUserlist();
    
    socket.on('msg', function(data, callback) {
        // make sure we've set our real name
        // don't trust the incoming display_name, it's just there for convenience on the client-side
        data.display_name = socket.request.user.display_name;
        delete data.unconfirmed; // this should really be removed before it gets to the server, since it's client-specific...
        
        socket.broadcast.emit('msg', data);
        console.log("user " + socket.request.user.display_name + " sent message: " + data.message);
        
/*         setTimeout(callback(data), 2000); */
        if (callback !== undefined) {
            callback(data);
        }
    });
    
    socket.on('disconnect', function() {
        console.log(socket.request.user.display_name+' disconnected');

        // remove from online list
/*         delete users[socket.request.user._id]; */
        users = users.filter(function( user ) {
            return user._id !== socket.request.user._id;
        });
        
        // update online list for everyone
/*         io.sockets.emit('userlist', { online: users }); */
        emitUserlist();
    });
    
});


