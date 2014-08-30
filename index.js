var express = require('express');
var app = express();
var cool = require('cool-ascii-faces')

app.use(express.logger());

app.get('/', function(request, response) {
  response.send(cool());
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});