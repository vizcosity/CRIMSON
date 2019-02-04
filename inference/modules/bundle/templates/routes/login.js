var express = require('express');
var router = express.Router();

module.exports = ({passport}) => {

  // Redirect to home if we are already logged in.
  router.get('/', function(req, res, next){
    console.log('Routing to login');
    // If user already logged in redirect to index.
    if (req.user) return res.redirect('/');
    res.render('login');
  });

  router.post('/', passport.authenticate('local', {failureRedirect: '/login'}), (req, res, next) => {
    res.redirect('/');
  });

  return router;
};
