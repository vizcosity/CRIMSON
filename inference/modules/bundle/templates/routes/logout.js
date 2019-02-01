var express = require('express');
var router = express.Router();

module.exports = () => {

  router.get('/', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  return router;
};
