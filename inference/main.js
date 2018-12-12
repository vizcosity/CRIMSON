/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

const detectContainers = require('./modules/detectContainers');
const {generateCode, generateACR } = require('./modules/generateCode');
const filterPrimitives = require('./modules/filterPrimitives');
const fs = require('fs');
const { resolve } = require('path');

var imagePath = process.argv[2];
imagePath = resolve(__dirname, imagePath);
var fileName = imagePath.split('/')[imagePath.split('/').lenght - 1]

detectContainers(imagePath).then(async containers => {

  var ACR = generateACR(containers);
  fs.writeFileSync('acr.json', JSON.stringify(ACR, null, 2));

  // Filter leftover primitives which have been used for inference but should not
  // be embedded as code.
  containers = filterPrimitives(containers);

  // console.log('filtered');

  // console.log(containers);

  var containerCode = await generateCode(containers);

  var HTMLOutput = `<!DOCTYPE html>
  <html>
    <head>
      <meta source-file="${fileName}" />
      <link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" />
      <link rel="stylesheet" type="text/css" href="style.css" />
    </head>
    <body>
    \t${containerCode}

    <!-- JS -->
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
    </body>
  </html>`

  fs.writeFileSync('index.html', HTMLOutput);


}).catch(console.err);
