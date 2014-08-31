var express = require('express');
var app = express();
var cool = require('cool-ascii-faces')

app.use(express.logger());
app.use('/css', express.static(__dirname + '/static/css'));
app.use('/js', express.static(__dirname + '/static/js'));
app.use('/img', express.static(__dirname + '/static/img'));
app.use('/js/libs', express.static(__dirname + '/bower_components'));

app.get('/', function(request, response) {
/*   response.send(cool()); */
/*     response.sendfile('index.html'); */
    response.sendfile('index.html');
});


var port = process.env.PORT || 5000;

app.listen(port, function() {
    console.log("Listening on " + port);
});
