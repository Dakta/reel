
/**
 * Expose
 */


var redis = require('redis');
var parseRedisUrl = require('parse-redis-url')(redis);

var redisConfig = parseRedisUrl.parse(process.env.REDISTOGO_URL);
redisConfig.pass = redisConfig.password;


module.exports = {
  db: process.env.MONGOLAB_URI,
  facebook: {
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_CLIENTSECRET,
    callbackURL: "http://localhost:"+process.env.PORT+"/auth/facebook/callback"
  },
  twitter: {
    consumerKey: process.env.TWITTER_CONSUMERKEY,
    consumerSecret: process.env.TWITTER_CONSUMERSECRET,
    callbackURL: "http://localhost:"+process.env.PORT+"/auth/twitter/callback"
  },
/*
  redis: {
    host: redisURL.hostname,
    port: redisURL.port,
//     user: redisURL.auth.split(":")[0],
    pass: redisURL.auth.split(":")[1],
  },
*/
  redis: redisConfig,

/*
  github: {
    clientID: process.env.GITHUB_CLIENTID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: 'http://nodejs-express-demo.herokuapp.com/auth/github/callback'
  },
  linkedin: {
    clientID: process.env.LINKEDIN_CLIENTID,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: 'http://nodejs-express-demo.herokuapp.com/auth/linkedin/callback'
  },
  google: {
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "http://nodejs-express-demo.herokuapp.com/auth/google/callback"
  }
*/
}
