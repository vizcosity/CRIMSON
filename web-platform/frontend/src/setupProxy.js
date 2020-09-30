/**
 * We need to namespace all of the generated front-ends under the
 * '/generated' namespace so that all requests /generated/* can be proxied
 * to the web API when running the development react server.
 *
 * @ Aaron Baw 2019.
 */

const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
     '/generated',
     proxy({
       target: 'http://localhost:3715',
       changeOrigin: true,
     })
   );
};
