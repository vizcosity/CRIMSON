/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

 const bundle = require('./modules/bundle');
 const detectPrimitives = require('./modules/detectPrimitives');
 const package = require('./package.json');
 const {generateCode, generateACR } = require('./modules/generateCode');
 const mkdir = require('mkdirp');
 const { resolve, basename } = require('path');
 const filterPrimitives = require('./modules/filterPrimitives');
 const fs = require('fs');

module.exports = {
  generateACR: async (imgPath) => {

    // Detect primitives.
    var primitives = await detectPrimitives(imgPath);

    log(`Detected primitives`, primitives);

    // Generate ACR from detected primitives.
    return generateACR(primitives);
  },

  /**
   * Given an ACR object, generates the source codes and bundles the project in
   * the output directory specified. If one is not specified, a temporary
   * directory is created. The path where the bundled project is produced is
   * then returned.
   *
   * @type {String} - Output directory path.
   */
  generateCode: async (acr, {
    fileName, file, outputDir, context, project, imgPath
  }) => {

    // Filter unwanted primitives used for inference.
    acr = filterPrimitives(acr);

    log(`Generating code for`, fileName);

    var code = await generateCode(acr);

    var HTMLOutput = `
    <!-- Skeleton Code generated below via CRIMSON prototyping tool ${package.version} -->
    <!-- Tool available at ${package.homepage} -->
    <!-- Copyright @ Aaron Baw 2018 -->
    <!DOCTYPE html>
    <html>
      <head>

        <!-- Metadata -->
        ${file ? `<meta source-filename="${file}" />` : ""}
        ${imgPath ? `<meta source-path="${imagePath}" />` : ''}
        <meta context="${context}" />
        <meta output-type="${project}" />

        <title>${fileName[0].toUpperCase() + fileName.substring(1, fileName.length)}</title>

        <!-- CSS -->
        <link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="style.css" />
      </head>
      <body>
      \t${code}

      <!-- JS -->
      <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
      </body>
    </html>`;

    log(`Generated Code.`);

    // If no outputDir passed, create a directory to save the project.
    if (!outputDir) {
      outputDir = resolve(__dirname, `./.output/${fileName}`);
      log(`No outputDir passed. Using:`, outputDir);
    }

    mkdir.sync(outputDir);

    log(`Bundling project and saving output to`, outputDir);
    await bundle({outputDir, context: context, targets: {source: HTMLOutput, name: 'index.html'}});

    return outputDir;

  }
};


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
