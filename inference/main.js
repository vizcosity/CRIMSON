/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

const detectContainers = require('./modules/detectContainers');
const generateCode = require('./modules/generateCode');
const fs = require('fs');
const shapeMap = require('./config/shapeMap.json');
const { resolve } = require('path');

var imagePath = process.argv[2];
imagePath = resolve(__dirname, imagePath);

detectContainers(imagePath).then(containers => {

  var containerCode = generateCode(containers);

  var HTMLOutput = `
  <!DOCTYPE html>
  <html>
    <body>
      ${containerCode}
    </body>
  </html>`

  fs.writeFileSync('index.html', HTMLOutput);


}).catch(console.err);
