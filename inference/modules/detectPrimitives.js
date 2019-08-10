/**
 * Primitive detecter wrapper which interfaces with the python detection scripts.
 */

// Dependencies.
const NodePyInt = require('./nodePyInt');
const request = require('request');
const path = require('path');

// Configuration.
const _DETECT_SCRIPT_PATH = "../../detection/src/shapeDetect.py";
const _WEB_API_ENDPOINT = process.env.SHAPE_DETECT_WEB_API_ENDPOINT || false;

// Performs shape detection using standard streams.
const detectViaStandardStream = async imagePath => {
  // Resolve path relative to root dir so that it can be interpreted correctly
  // by the python script.
  // imagePath = resolve(__dirname, imagePath);

  log("Detecting shapes for "+ imagePath);

  // Instantiate the Node-Python-Interface.
  var detectShapes = NodePyInt(
    path.resolve(__dirname,_DETECT_SCRIPT_PATH),
    ['--image', imagePath], {
      pythonCmd : 'python3'
    });

  // Initialise analysis and return result as a JSON object.
  var output = {};

  try {
    output = await detectShapes();
  } catch(e){
    log("Error detecting shapes: ", e);
  }

  return output;
}

// Performs shape detection by interfacing through a RESTful endpoint.
const detectViaAPI = imagePath => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: _WEB_API_ENDPOINT,
      headers:
       { 'Postman-Token': '92d241b7-a0ea-4308-aab8-50e955ff62d0',
         'cache-control': 'no-cache',
         'Content-Type': 'application/x-www-form-urlencoded',
         'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
      formData: {
         Image: {
            value: fs.createReadStream(path.resolve(imagePath)),
            options:
             {
               filename: imagePath,
               contentType: null
             }
           }
        }
    }, (err, res, body) => {
      if (err) return reject(err);
      return resolve(body);
    })
});

// Depending on whether the _WEB_API_ENDPOINT is set (indicating a server is running
// and ready to receive requests to construct a shape hierarchy), choose to detect
// shapes via the web API, or standard streams.
module.exports = async (imagePath) => _WEB_API_ENDPOINT ? await detectViaAPI(imagePath) : detectViaStandardStream(imagePath);


// Utility functions.
function log(...msg){
  if (process.env.DEBUG) console.log(`DETECT CONTAINER | `, ...msg);
}
