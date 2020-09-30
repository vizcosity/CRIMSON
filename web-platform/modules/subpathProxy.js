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

  // Ensure that we are parsing HTML and not other assets / media.
  // We do this by ensuring that throughout the code, we have at least one
  // set of opening and closing tags. Regex test credit: https://stackoverflow.com/a/15459273
  var htmlTest = /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/i.test(pageData.toString('utf8'))

  if (!htmlTest) return pageData;

  // Replace all <a> tag 'href' attributes to be prefixed by subpath.
  var $ = cheerio.load(pageData);
  var aTags = $('a');
  for (var i = 0; i < aTags.length; i++){
    $(aTags[i]).attr('href', `/${subpath}${$(aTags[i]).attr('href')}`);
  }

  // Replace all <link> tags, which referece CSS assets, so that the local
  // files which are referenced are prefied by the subpath and are accessed
  // appropriately when proxied.
  var linkTags = $('link');

  // Find link tags which are *not* urls (referencing local files) and prefix
  // the 'src' attributes with the appropriate subpath prefix.
  for (var i = 0; i < linkTags.length; i++){
    var linkTag = $(linkTags[i]);
    var currentHref = linkTag.attr('href');
    linkTag.attr('href', currentHref && currentHref.indexOf('http') === -1 ? `/${subpath}/${currentHref}` : currentHref);
  }

  // Replace all <script> tags which refer to local files.
  var scriptTags = $('script');
  for (var i = 0; i < scriptTags.length; i++){
    var scriptTag = $(scriptTags[i]);
    var currentSrc = scriptTag.attr('src');
    // Replace the tag src attribute only if it is a local resource.
    scriptTag.attr('src', currentSrc && currentSrc.indexOf('http') === -1 ? `/${subpath}/${currentSrc}` : currentSrc);
  }

  return $.html();
}

module.exports = (app, host, subpath) => {
  app.use(proxy(host, {
    filter: (req, res) => {
      log(`Determining whether request:`, req.url, `should be proxied.`);
      return req.url.indexOf(subpath) !== -1
    },
    proxyReqPathResolver: req => req.url.split(subpath)[1],
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => subspaceURLSForSubpath(subpath, proxyResData)
  }));
  log(`Configured proxy for host`, host, `on subpath`, subpath);
  return subpath;
}

function log(...msg){
  if (process.env.DEBUG) console.log(`SUBPATH PROXY |`, ...msg);
}
