/**
 * Inference pipeline entry point for CRIMSON rapid ui prototyping tool.
 *
 *  @ Aaron Baw 2018
 */

 const { bundle } = require('./modules/bundle/bundle');
 const detectPrimitives = require('./modules/detectPrimitives');
 const { inferCompoundPrimitives, serialise } = require('./modules/inference/inferCompound');
 const inferProperties = require('./modules/inference/infer');
 const { inferGrid } = require('./modules/inference/inferGrid');
 const { getLastACRObjectId } = require('./modules/geometry');
 const package = require('./package.json');
 const {generateCode, generateACR } = require('./modules/generateCode');
 const mkdir = require('mkdirp');
 const remove = require('remove');
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

    process.env['CRIMSON_PROJECT_TYPE'] = project;

    // Filter unwanted primitives used for inference.
    acr = filterPrimitives(acr);

    log(`Generating code for`, fileName);

    // Infer types on the potentially modified primitives.
    acr = inferProperties(acr, project);

    log(`Inferring compound primitives for`, fileName);
    acr = inferCompoundPrimitives(acr);

    log(`Inferring Grids for`, fileName);
    acr = inferGrid(acr, getLastACRObjectId(acr));

    // console.log(acr);

    log(`Code generation parameters:`, fileName, file, outputDir, context, project, imgPath, zip);

    var code = await generateCode(acr);

    log(`Generated Code.`);

    // If no outputDir passed, create a directory to save the project.
    if (!outputDir) {
      outputDir = resolve(__dirname, `./.output/${fileName}`);
      log(`No outputDir passed. Using:`, outputDir);
    }

    // Clear & create output directory.
    mkdir.sync(outputDir);
    remove.removeSync(outputDir);
    mkdir.sync(outputDir);

    log(`Bundling project [${project}] and saving output to`, outputDir);
    var zipPath = await bundle({
      zip,
      context,
      projectType: project,
      outputDir,
      imagePath: imgPath,
      filteredACR: acr,
      code,
      file,
      fileName,
      package,
      generateAuth: process.env.CRIMSON_GENERATE_AUTH
    });

    return zip ? zipPath : outputDir;
  },
  detectPrimitives,
  inferCompoundPrimitives, 
  filterPrimitives,
  markDisplayablePrimitives,
  serialise,
  inferProperties,
  inferGrid,
  getLastACRObjectId,
};


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
