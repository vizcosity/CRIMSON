/**
 * Subpath proxy module.
 *
 * This module configures an express proxy which allows another express server
 * to be hosted on a subpath of the parent. This is achieved by dynamically
 * re-writing the 'href' attributes for each <a> tag in order to be prefixed
 * by the subpath.
 */

const proxy = require('express-http-proxy');
const express = require('express');
const cheerio = require('cheerio');


// Takes in the subpath where the contained app will exist, and re-writes all
// <a> tag href attributes so that they are prefixed by this subpath.
const subspaceURLSForSubpath = (subpath, pageData) => {
  log(`Recieved proxy request.`);
  var $ = cheerio.load(pageData);
  var aTags = $('a');
  for (var i = 0; i < aTags.length; i++){
    $(aTags[i]).attr('href', `/${subpath}${$(aTags[i]).attr('href')}`);
  }
  return $.html();
}

module.exports = (app, host, subpath) => {
  app.use(proxy(host, {
    filter: (req, res) => req.url.indexOf(subpath) !== -1,
    proxyReqPathResolver: req => req.url.split(subpath)[1],
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => subspaceURLSForSubpath(subpath, proxyResData)
  }));
  log(`Configured proxy for host`, host, `on subpath`, subpath);
  return subpath;
}

function log(...msg){
  if (process.env.DEBUG) console.log(`SUBPATH PROXY |`, ...msg);
}
