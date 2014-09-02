var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var Engine = require('tingodb')(),
    assert = require('assert');


var db = new Engine.Db('./tingodb', {});
var collection = db.collection("batch_document_insert_collection_safe");
/*
collection.insert([{hello:'world_safe1'}
  , {hello:'world_safe2'}], {w:1}, function(err, result) {
  assert.equal(null, err);

  collection.find({hello:'world_safe2'}, function(err, item) {
    assert.equal(null, err);
    assert.equal('world_safe2', item.hello);
  });
});
*/


app.use('/css', express.static(__dirname + '/static/css'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/img', express.static(__dirname + '/static/img'));
app.use('/js/libs', express.static(__dirname + '/bower_components'));


app.get('/', function(req, res){
res.sendfile('index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');

    collection.findOne({hello:'world_safe2'}, function(err, item) {
        console.log(item);
        socket.emit('raw', item);
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

var port = process.env.port || 5000;

http.listen(port, function(){
    console.log('listening on *:'+port);
});

