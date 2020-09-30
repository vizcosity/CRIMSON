var express = require('express');
var router = express.Router();

module.exports = ({subpathPrefix}) => {

  router.get('/', (req, res) => {
    req.logout();
    res.redirect(`/${subpathPrefix}`);
  });

  return router;
};
