var express = require('express');

// var http = require('http').Server(app);
// var config = require('./oauth.js');
// var redisConfig = require('./redis.js');
var passportSocketIo = require("passport.socketio");
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// simpleflake for UID generation (profiles, content)
var flake = require('simpleflake');
// generation util to produce 
var flakeGen = function() {
    return flake().toString('base58');
};

// markdown processor
var marked = require('marked');



// connect to database
var mongoose = require('mongoose'),
    mongoURI = process.env.MONGOLAB_URI || 'oops'; // fallback is dangerous, make failure obvious


// mongoose does this async, which is nice
mongoose.connect(mongoURI, function(err, res) {
    if (err) {
        console.log ('ERROR connecting to: ' + mongoURI + '. ' + err);
    } else {
        console.log ('Succeeded connected to: ' + mongoURI);
    }
});



var fs = require('fs');
// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
  console.log('loaded '+file);
});

var Account = mongoose.model('Account');
var Profile = mongoose.model('Profile');


var passport = require('passport');

var config = require('./config/config');

// Bootstrap passport config
require('./config/passport')(passport, config);


// sitewide session middleware config
var expressSession = require("express-session");
var connectRedis = require('connect-redis')(expressSession);

var redisStore = new connectRedis(config.redis);



var sessionMiddleware = expressSession({
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
/*     console.log(req.params); */
    
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

    Profile.paginate({ /* extra paginator options */ }, '_id')
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

/*     console.log(req.params); */

    Profile.findById(req.params.userid, function(err, profile) {
        if (err) {
            console.log(err);
        } else {
            res.send(profile);
        }
    });
/*     res.sendfile('index.html'); */
});


app.get('/conversations', ensureAuthenticated, function(req, res) {
/*     console.log(req.params); */
    
    var params = {};
    
    // from query string to mongoose-paginate params
    if (req.query.hasOwnProperty('after')
        && req.query.after != null
    ) {
        params.after = req.query.after;
    } else if (req.query.hasOwnProperty('before')
        && req.query.before != null
    ) {
        params.before = req.query.before;
    }
/*     res.send(req.params); */

    Conversation.paginate({ /* extra paginator options */ }, '_id')
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

// messages
app.get('/conversations/:conversationid/:conversationname?', ensureAuthenticated, function(req, res) {

/*     console.log(req.params); */

    Conversation.findById(req.params.conversationid, function(err, conversation) {
        if (err) {
            console.log(err);
        } else {
            res.send(conversation);
        }
    });
/*     res.sendfile('index.html'); */
});



//
// TODO: Wrap this in an express Router
//

var accountRouter = express.Router();

// dumb auth landing
app.get('/auth', function(req, res) {
    res.send('<html><a href="/auth/twitter">Twitter</a> or <a href="/auth/facebook">Facebook</a> or <a href="/auth/logout">log out</a>.</html>');
});

// auth provider routes
app.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {});
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/failed' }), function(req, res) {
    res.redirect('/');
});
app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res) {});
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/failed' }), function(req, res) {
    res.redirect('/');
});

// logout route
app.get('/auth/logout', ensureAuthenticated, function(req, res) {
    var name = req.user.display_name;
    console.log("LOGGIN OUT " + name);
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out, " + name + "!";
});

app.get('/auth/delete', ensureAuthenticated, function(req, res) {
    Profile.findById(req.user._id, function(err, profile) {
        if (err) console.log(err);
        if (!err && profile != null) {
            // nuke current user (profile and all auth methods)
            
            profile.accounts.forEach(function(account_id) {
                Account.findByIdAndRemove(account_id);
            });
            profile.remove();
            profile.save();
            req.logout();
            res.redirect('/');
            req.session.notice = "Your account has been deleted.";
        } else {
            // uh oh
            res.send(err);
        }
    });
});



// socket.io websocket stuff

// authentication middleware

// authenticate
io.use(passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  secret:      'my_precious',    // the session_secret to parse the cookie
  store:       redisStore
}));


// redis client for pubsub
var redis = require("redis");


// list of online users
var users = [];


// message/conversation stuff
var Message = mongoose.model('Message')
  , Conversation = mongoose.model('Conversation')


// make sure we have at least one conversation when people join
Conversation.findOne({ name: "Root" }, function(err, conversation) {
    if (err) {
        console.log(err);
    } else if (conversation == null) {
        // create a default convo
        var Root = new Conversation({
            created: Date.now(),
            is_public: true,
            name: "Root",
        });

        Profile.findOne({ display_name: "Dakota Schneider" }, function(err, acct) {
            if (err) console.log(err);
            
            Root.creator = acct._id;
            Root.save(function(err, obj) {
                if (err) console.log(err);
            });
        });
    } else {
        // pass
        console.log('found');
//         console.log(conversation);
    }
});


/*
    Flow:
    - Connect
        - Subscribe to notifications, status, etc. (default/meta)
        - Subscribe to default conversation
        - Push the above
        - Push last x items from conversation on subscribe
    - Subscribe
        - sub.subscribe('channel/'+name)
        - save subscribe state?
        - do something with notifications?
    - Unsubscribe
    - Conversation list
    - subscribe to public conversation
    - Create New conversation
        - create with name and options
        - subscribe
    - leave conversation
    - modify conversation (currently only creator)
*/



// connect
io.on('connection', function(socket){
    console.log('a user connected');

    // add user to connected list
    users[socket.request.user._id] = socket.request.user;
//     users.push(socket.request.user);

    var pub = redis.createClient(config.redis.port, config.redis.host),
        sub = redis.createClient(config.redis.port, config.redis.host);
        
    pub.auth(config.redis.password, function() {
        console.log('redis pub connected'); 
    });
    sub.auth(config.redis.password, function() {
        console.log('redis sub connected'); 
    });
    
    /*
     Use Redis' 'sub' (subscriber) client to listen to any message from Redis to server.
     When a message arrives, send it back to browser using socket.io
     */
    sub.on('message', function (channel, message) {
        console.log('redis sub got message');
        var obj = JSON.parse(message);
        
        if (obj.socket_id != socket.id) {
            // sanitize before we send out
            delete obj.socket_id;
            socket.emit(channel, obj);
        }
    });

    // these should map to a socket.join() call
    // so data pipes out from a client through a socket channel,
    // through a redis channel to redis, then back through a redis channel, socket channel, etc.
    sub.subscribe('msg');


    // provide a backlog of messages on join
    Message.paginate({ /* extra paginator options */ }, 'created')
        .limit(10) // overrides default limit, if set
        .populate('author')
        .exec(function(err, obj) {
            for (var i=obj.length-1; i>-1; i--) {
                socket.emit('msg', obj[i]);
            }
        });

    
    // tell our user their own name (yeah)
    socket.emit('set_self', socket.request.user);
    
    // update online list for everyone
    function emitUserlist() {
        // flatten it properly; ugh
        var userarray = [];
        for (var u in users) {
            if (users.hasOwnProperty(u)) userarray.push(users[u]);
        }
        // emit to all;
        // this needs a redis channel
        io.sockets.emit('userlist', [ { name: 'Online', data: userarray} ]);
    }
    emitUserlist();
    
    
    // doesn't work yet
    function emitConvoList() {
        // get the ids of conversations (limit 10) sorted by most recent message
        Message.aggregate([
            { $sort : { date: -1 } },
            { $group : { _id : "$conversation" } },
            { $limit : 10 }
        ],
        function(err, obj) {
            // console.log(obj);
        });

    }
//     emitConvoList();
    
    socket.on('msg', function(data, callback) {
        // make sure we've set our real name
        // don't trust the incoming display_name, it's just there for convenience on the client-side
        data.display_name = socket.request.user.display_name;
        delete data.unconfirmed; // this should really be removed before it gets to the server, since it's client-specific...


        // add in socket id so we can emit without dupes on the source connection
        var redisData = data;
        redisData.socket_id = socket.id; // we shouldn't expose this
        // publish on redis -> other instances of server pick it up and broadcast it to clients
        pub.publish('msg', JSON.stringify(redisData));

        // new message to stick in archive        
        message = new Message({
            author: socket.request.user._id,
            created: Date.now(),
            body: data.body,
            body_html: data.body_html,
        });
        
        // try and find the conversation it goes to
        // if none, leave it null?
        // Should we have a "misc" channel of messages with null conversation? that could be interesting.
        Conversation.findById(message.conversation_id, function(err, conversation) {
            if (err) {
                console.log(err);
                // return error response?
/*
            } else if (conversation == null) {
                // no such convo...
                console.log('no such conversation '+message.conversation_id);
                
                message.conversation = '5445f1dbabddf8fdd663a3d2';
                
                message.save(function(err, message_obj) {
                    if (err) {
                        console.log(err);
                    } else {
                        // push onto convo messages list
                        // conversation.messages.push(message._id);
                        // publish on redis
                        console.log(conversation);

                        
                    }
                });
*/
            } else {
                console.log('conversation id');
                console.log(conversation);
                
                message.save(function(err, message_obj) {
                    if (err) {
                        console.log(err);
                    } else {
                        // if we have a convo to update
                        if (conversation != null) {
                            // push onto convo messages list
                            conversation.messages.push(message._id);
                            conversation.save();
                        }
                        // otherwise nothing to do
                    }
                });
            }
        })
        
//         console.log("user " + socket.request.user.display_name + " sent message: " + data.message);
        
        if (callback !== undefined) {
            callback(data);
        }
    });
        
    socket.on('disconnect', function() {
        console.log(socket.request.user.display_name+' disconnected');
        
        sub.quit();
        pub.quit();

        // remove from online list
        delete users[socket.request.user._id];
/*
        users = users.filter(function( user ) {
            return user._id !== socket.request.user._id;
        });
*/
        
        // update online list for everyone
/*         io.sockets.emit('userlist', { online: users }); */
        emitUserlist();
    });
    
});


