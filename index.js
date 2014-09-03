var express = require('express');
var app = express();
// var http = require('http').Server(app);


var port = process.env.port || 5000;

var server = app.listen(port, function(){
    console.log('listening on '+port);
});

var io = require('socket.io').listen(server);



// express config
app.use('/css', express.static(__dirname + '/static/css'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/img', express.static(__dirname + '/static/img'));
app.use('/js/libs', express.static(__dirname + '/bower_components'));


/*
var Engine = require('tingodb')(),
    assert = require('assert');

var db = new Engine.Db('./tingodb', {});
var collection = db.collection("batch_document_insert_collection_safe");

collection.insert([{hello:'world_safe1'}
  , {hello:'world_safe2'}], {w:1}, function(err, result) {
  assert.equal(null, err);

  collection.find({hello:'world_safe2'}, function(err, item) {
    assert.equal(null, err);
    assert.equal('world_safe2', item.hello);
  });
});
*/


var mongoose = require('mongoose'),
    mongoURI = process.env.MONGOLAB_URI || 'oops';

// mongoose does this async, which is nice
mongoose.connect(mongoURI, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoURI + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + mongoURI);
  }
});


// database schemas
var userSchema = new mongoose.Schema({
  name: {
    first: { type: String, trim: true },
    last: { type: String, trim: true }
  },
  age: { type: Number, min: 0}
});

var User = mongoose.model('Users', userSchema);

/*
var newUser = new User({
    name: {
        first: 'John',
        last: ' Doe'
    },
    age: 28
});
newUser.save(function(err) {
    if (err) {
        console.log(err);
    }
    console.log('inserted john doe');
});
*/


// express routing
app.get('/', function(req, res) {
    console.log('got /');
    res.sendfile('index.html');
});

app.get('/users/:userid/:username?', function(req, res) {

    console.log(req.params);
    res.sendfile('index.html');
});


// socket.io websocket stuff
io.on('connection', function(socket){
    console.log('a user connected');

/*
    collection.findOne({hello:'world_safe2'}, function(err, item) {
        console.log(item);
        socket.emit('raw', item);
    });
*/

    User.find({}).exec(function(err, res) {
        if (!err) {
            socket.emit('raw', res);
        } else {
            console.log('fail: '+err);
        }
    });
    
    socket.on('setPseudo', function (data) {
        console.log('user set pseudo '+data);
        socket.pseudo = data;
    });
    
    socket.on('message', function(data, callback){
        // inject pseudo and pass to other users
        data.pseudo = socket.pseudo;
        
        socket.broadcast.emit('message', data);
        console.log("user " + data.pseudo + " sent message: " + data.message);
        
        callback(data);
    });
    
    socket.on('disconnect', function(){
        console.log(socket.pesudo+' disconnected');
    });
    
});



