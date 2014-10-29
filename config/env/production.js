
/**
 * Expose
 */

var url = require('url')
  , redisURL = url.parse(process.env.REDISTOGO_URL)

module.exports = {
  db: process.env.MONGOLAB_URI,
  facebook: {
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_CLIENTSECRET,
    callbackURL: "http://reel.rocks/auth/facebook/callback"
  },
  twitter: {
    consumerKey: process.env.TWITTER_CONSUMERKEY,
    consumerSecret: process.env.TWITTER_CONSUMERSECRET,
    callbackURL: "http://reel.rocks/auth/twitter/callback"
  },
  redis: {
    host: redisURL.hostname,
    port: redisURL.port,
//     user: redisURL.auth.split(":")[0],
    pass: redisURL.auth.split(":")[1],
  },
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
};