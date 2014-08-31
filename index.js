var express = require('express');
var app = express();
var cool = require('cool-ascii-faces')

app.use(express.logger());
app.use('/static', express.static(__dirname + '/static'));
app.use('/static/libs', express.static(__dirname + '/bower_components'));

app.get('/', function(request, response) {
/*   response.send(cool()); */
/*     response.sendfile('index.html'); */
    response.sendfile('index.html');
});


var port = process.env.PORT || 5000;

function go() {
    setTimeout(function () {
        app.listen(port, function() {
            console.log("Listening on " + port);
            });
        }, 2000);
}

try {
    go();
} catch (err) {
    go();
}