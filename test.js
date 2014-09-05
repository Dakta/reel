var flake = require('simpleflake');

var flakeGen = function() {
    return flake().toString('base58');
};

console.log(flakeGen());