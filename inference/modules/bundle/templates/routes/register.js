var express = require('express');
var router = express.Router();

module.exports = ({db, passport}) => {

  router.get('/', (req, res) => {

    res.render('register');

  });

  router.post('/', async (req, res) => {

    if (req.body.password !== req.body.confirmPassword) return res.redirect('/register');

    try {
      // Create entry in the user db.
      var user = await db.createUser({username: req.body.username, password: req.body.password});
    } catch(e){
      res.redirect('/register');
      // Add flash message detailing the error.
    }

    // Login the user.
    req.login(user, (err) => {
      if (err) return res.redirect('/register');
      res.redirect('/');
    })

  });

  return router;
};
