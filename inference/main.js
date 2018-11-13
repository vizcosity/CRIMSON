/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

const detectContainers = require('./modules/detectContainers');
const generateCode = require('./modules/generateCode');
const fs = require('fs');
const { resolve } = require('path');

var imagePath = process.argv[2];
imagePath = resolve(__dirname, imagePath);

detectContainers(imagePath).then(async containers => {

  var containerCode = await generateCode(containers);

  var HTMLOutput = `<!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" />
      <link rel="stylesheet" type="text/css" href="style.css" />
    </head>
    <body>
    \t${containerCode}
    </body>
  </html>`

  fs.writeFileSync('index.html', HTMLOutput);


}).catch(console.err);
