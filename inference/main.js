/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

 const bundle = require('./modules/bundle');
 const detectPrimitives = require('./modules/detectPrimitives');
 const { inferCompoundPrimitives } = require('./modules/inference/inferCompound');
 const inferProperties = require('./modules/inference/infer');
 const { inferGrid } = require('./modules/inference/inferGrid');
 const { getLastACRObjectId } = require('./modules/geometry');
 const package = require('./package.json');
 const {generateCode, generateACR } = require('./modules/generateCode');
 const mkdir = require('mkdirp');
 const { resolve, basename } = require('path');
 const {filterPrimitives, markDisplayablePrimitives} = require('./modules/filterPrimitives');
 const fs = require('fs');

module.exports = {
  generateACR: async (imgPath) => {

    // Detect primitives.
    var primitives = await detectPrimitives(imgPath);
    // Mark shapes which should be drawn by the interactive ACR customiser
    // tool.
    primitives = markDisplayablePrimitives(primitives);

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
    fileName, file, outputDir, context, project, imgPath, zip
  }) => {

    // Filter unwanted primitives used for inference.
    acr = filterPrimitives(acr);

    log(`Generating code for`, fileName);

    // Infer types on the potentially modified primitives.
    acr = inferProperties(acr);

    log(`Inferring compound primitives for`, fileName);
    acr = inferCompoundPrimitives(acr);

    // log(`Inferring Grids for`, fileName);
    // acr = inferGrid(acr, getLastACRObjectId(acr));

    // console.log(acr);

    log(`Code generation parameters:`, fileName, file, outputDir, context, project, imgPath, zip);

    var code = await generateCode(acr);

    var HTMLOutput = `
    <!-- Skeleton Code generated below via CRIMSON prototyping tool ${package.version} -->
    <!-- Tool available at ${package.homepage} -->
    <!-- Copyright @ Aaron Baw 2018 -->
    <!DOCTYPE html>
    <html>
      <head>

        <!-- Metadata -->
        <meta source-filename="${file}" />
        <meta source-path="${imgPath}" />
        <meta context="${context}" />
        <meta output-type="${project}" />

        <title>${fileName[0].toUpperCase() + fileName.substring(1, fileName.length)}</title>

        <!-- CSS -->
        <link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" />
        {{cssEmbed}}
      </head>
      <body>
      \t${code}

      <div id="source-image-preview" style="
        background-image: url('{{bgImagePath}}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center center;
        height: 100%;
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        opacity: 0.3;
        z-index: -1;
      " class="meta hidden"></div>

      <!-- JS -->
      <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
      {{jsEmbed}}
      </body>
    </html>`

    log(`Generated Code.`);

    // If no outputDir passed, create a directory to save the project.
    if (!outputDir) {
      outputDir = resolve(__dirname, `./.output/${fileName}`);
      log(`No outputDir passed. Using:`, outputDir);
    }

    mkdir.sync(outputDir);

    log(`Bundling project and saving output to`, outputDir);
    var zipPath = await bundle({zip, outputDir, imgPath, context: context, filteredACR: acr, targets: {source: HTMLOutput, name: 'index.html'}});

    return zip ? zipPath : outputDir;

  }
};


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
