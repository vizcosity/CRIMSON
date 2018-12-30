/**
 * REST API for generating ACR and source codes using CRIMSON.
 *
 * @ Aaron Baw 2018
 */

// Dependencies.
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const package = require('./package.json');
const endpointPrefix = `/api/v${package['api-version']}`;
const multer = require('multer');
const { resolve, basename, extname } = require('path');
const upload = multer({
  dest: resolve(__dirname, "./.uploads"),
  preservePath: true,
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './.uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + extname(file.originalname))
    }
  })
});

const crimson = require('crimson-inference');
app.use(bodyParser.json());

// Register a POST endpoint for generating the ACR.
app.post(`${endpointPrefix}/generateACR`, upload.single('wireframe'), async (req, res, params) => {

  if (!req.file) return res.json({success: false, error: "No file provided."});

  // req.file['wireframe'].path contains path to the uploaded image wireframe.
  // req.body contains the other text fields which may be included.
  // log(req.file);
  var imgPath = req.file.path;

  try {
    // Generate the ACR.
    var acr = await crimson.generateACR(resolve(__dirname, imgPath));
  } catch(e){
    res.json({success: false, error: e});
  }
  // Send ACR as response.
  res.json(acr);
});

// Register POST endpoint to generate code from ACR representation.



app.listen(process.env.PORT ? process.env.PORT : 3000, () => log(`Listening on`,
process.env.PORT ? process.env.PORT : 3000));

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
