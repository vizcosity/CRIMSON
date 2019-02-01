/**
 * Project bundler common functions.
 *
 * @ Aaron Baw 2018.
 */

const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');
const ejs = require('ejs');
const config = require('../../config/config');
const { spawn, exec } = require('child_process');
const {resolve, join, basename} = require('path');
const resolvePath = resolve;
const glob = require('glob');

// Generate code to embed bundled assets in webpage.
const generateBundleEmbed = (files) => {

  var cssFiles = files.filter(file => file.split('.')[1] == "css");
  var jsFiles = files.filter(file => file.split('.')[1] == "js");

  return {
    cssEmbed: cssFiles.reduce((prev, curr) => `<link rel="stylesheet" type="text/css" href="${join('public', 'stylesheet', curr)}" />\n${prev}`, ""),
    jsEmbed:  jsFiles.reduce((prev, curr) => `<script src=${join('public', 'js', curr)}></script>\n${prev}`, ""),
  }

}

// Loads template file.
const loadTemplate = (name) => {
  var contents = fs.readFileSync(path.join(__dirname, 'templates', 'views', (name + '.ejs')), 'utf-8');
  var locals = Object.create(null)

  function render () {
    return ejs.render(contents, locals);
  }

  return {
    locals: locals,
    render: render
  }
}

// Server bundle project directory structure:
// public
//  - images
//  - js
//  - stylesheet
// routes
// views
//  - index.ejs
//  - navigation.ejs
// app.js
// package.json

// Creates the directory structure for the express server.
const createDirStructure = (projectType, outputDir) => {

  // Create the following structure:
  /**
   * db (* server)
   * public
   *  - images
   *  - js
   *  - stylesheet
   *  routes (* server)
   *  views (* server)
   */
   mkdir.sync(join(outputDir, 'public', 'images'));
   mkdir.sync(join(outputDir, 'public', 'js'));
   mkdir.sync(join(outputDir, 'public', 'stylesheet'));

   if (projectType === 'server'){
     log(`Creating dir:`, join(outputDir, 'db'))
     mkdir.sync(join(outputDir, 'db'));
     mkdir.sync(join(outputDir, 'routes'));
     mkdir.sync(join(outputDir, 'views'));

   };

};

const copyContextFiles = (context, projectType, outputDir) => new Promise((resolve, reject) => {

  // log(`Copying context files for ${context} to ${outputDir}.`);

  var bundled = [];

  createDirStructure(projectType, outputDir);

  // log(`Created dir structure.`);

  // Collect global assets for context and copy them to the output directory.
  glob(join(__dirname, '../../global')+`/*(${context}*.*|debug*.*)`, async (err, files) => {

    files.forEach(file => {
      var fileDir = outputDir;
      var ext = file.split('.')[1];

      if (ext == 'js') fileDir = join(fileDir, 'public', 'js');
      if (ext == 'css') fileDir = join(fileDir, 'public', 'stylesheet');

      var outputFileName = file;

      // Rename files appropriately.
      // if (config.globalAssetMap[ext])
      //   outputFileName = `${config.globalAssetMap[ext]}.${ext}`

      // Register bundled asset.
      bundled.push(basename(outputFileName));

      // log('Copying', file, 'to', join(fileDir,basename(outputFileName)));
      fs.copyFileSync(file, join(fileDir,basename(outputFileName)));

    });

    // Return the registered files we have collected so far.s
    resolve(bundled);

  });


});

const zipDir = (projectName, outputDir) => new Promise((resolve, reject) => {
  log(`Zipping ${resolvePath(outputDir, '../')}.`);
  var zipCmd = spawn('zip', ['-r', `${projectName}/${projectName}.zip`, `./${projectName}`], {
    cwd: resolvePath(outputDir, '../')
  });
  zipCmd.on('close', () => resolve(resolvePath(outputDir, '../')));
  zipCmd.on('stdout', data => log(data.toString()));
});

module.exports = {
  loadTemplate,
  copyContextFiles,
  generateBundleEmbed,
  createDirStructure
}


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
