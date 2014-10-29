
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Profile = mongoose.model('Profile');
var utils = require('../../lib/utils');

/**
 * Load
 */

exports.load = function (req, res, next, id) {
/*
  var options = {
    criteria: { _id : id }
  };
  User.load(options, function (err, user) {
*/
  Profile.findOne({ _id: id }, function(err, profile) {
    if (err) return next(err);
    if (!profile) return next(new Error('Failed to load User ' + id));
    req.profile = profile;
    next();
  });
};

/**
 * Create user
 */

/*
exports.create = function (req, res) {
  var user = new User(req.body);
  user.provider = 'local';
  user.save(function (err) {
    if (err) {
      return res.render('users/signup', {
        error: utils.errors(err.errors),
        user: user,
        title: 'Sign up'
      });
    }

    // manually login the user once successfully signed up
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    });
  });
};
*/

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var user = req.profile;
/*
  res.render('users/show', {
    title: profile.display_name,
    profile: profile
  });
*/
  res.send(user);
};

/**
 * List
 */

exports.index = function (req, res){
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

    Profile.paginate(params)
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
};

/**
 * Login
 */

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

// dummy method called by third-party login providers
exports.signin = function (req, res) {};

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login',
    message: req.flash('error')
  });
};

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/login');
};

/**
 * Session
 */

exports.session = login;