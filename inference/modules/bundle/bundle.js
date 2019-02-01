/**
 * Project bundler.
 *
 * Collects relevant assets, writes to the output directory and configures the
 * desired environment / context.
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
// const staticBundle = require('./staticBundle');
// const serverBundle = require('./serverBundle');
const glob = require('glob');

// Generate code to embed bundled assets in webpage.
function generateBundleEmbed(files){

  var cssFiles = files.filter(file => file.split('.')[1] == "css");
  var jsFiles = files.filter(file => file.split('.')[1] == "js");

  return {
    cssEmbed: cssFiles.reduce((prev, curr) => `<link rel="stylesheet" type="text/css" href="${join('public', 'stylesheet', curr)}" />\n${prev}`, ""),
    jsEmbed:  jsFiles.reduce((prev, curr) => `<script src=${join('public', 'js', curr)}></script>\n${prev}`, ""),
  }

}

// Loads template file.
function loadTemplate (name) {
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

// Creates the directory structure for the express server.
const createDirStructure = (context, outputDir) => {

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
   log(`Creating dir:`, join(outputDir, 'public', 'images'))
   mkdir.sync(join(outputDir, 'public', 'images'));
   mkdir.sync(join(outputDir, 'public', 'js'));
   mkdir.sync(join(outputDir, 'public', 'stylesheet'));
   if (context === 'server'){
     mkdir.sync(join(outputDir, 'db'));
     mkdir.sync(join(outputDir, 'routes'));
     mkdir.sync(join(outputDir, 'views'));

   };

};

const copyContextFiles = (context, outputDir) => new Promise((resolve, reject) => {

  // log(`Copying context files for ${context} to ${outputDir}.`);

  var bundled = [];

  createDirStructure(context, outputDir);

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

      log('Copying', file, 'to', join(fileDir,basename(outputFileName)));
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

const staticBundle = async ({
  outputDir,
  context,
  projectType,
  filteredACR,
  imagePath,
  code,
  file,
  fileName,
  package,
  zip=false
}) => {

    // Load 'index' view template.
    var index = loadTemplate('index');

    index.locals.code = code;
    index.locals.projectType = projectType;
    index.locals.context = context;
    index.locals.file = file;
    index.locals.package = package;
    index.locals.fileName = fileName;
    index.locals.imagePath = imagePath;

    var contextFiles = await copyContextFiles(context, outputDir);

    const projectName = outputDir.split('/')[outputDir.split('/').length - 1];

    log(`Bundling static project`, projectName);

    // Copy the source image over to the bundle.
    log(`Copying imagePath`, imagePath, `to`, join(outputDir, 'public', 'images', basename(imagePath)));
    fs.copyFileSync(imagePath, join(outputDir, 'public', 'images', basename(imagePath)));
    contextFiles.push(basename(imagePath));

    // Write the filteredACR file.
    fs.writeFileSync(join(outputDir, 'filteredACR.json'), JSON.stringify(filteredACR, null, 2));


    bundled = {
      ...generateBundleEmbed(contextFiles),
      bgImagePath: join('public', 'images', basename(imagePath))
    };

    // Embed assets in template.
    for (var assetType in bundled){
      index.locals[assetType] = bundled[assetType];
    }

    // Render & write the index file.
    fs.writeFileSync(join(outputDir, 'index.html'), index.render());

    // Zip project.
    if (zip) return zipDir(projectName, outputDir);
    else return bundled;
};

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
// package

/**
 * Bundle
 * @param  {[type]} outputDir    [description]
 * @param  {[type]} filteredACR  [description]
 * @param  {[type]} context      [Type of content (Bootstrap, Semantic UI, Materialise)]
 * @param  {[type]} imgPath      [Path of source image]
 * @param  {[String]} projectType [Output project type; e.g. 'server', 'static', etc]
 * @param  {[type]} targets      [Source files which will be output]
 * @param  {[type]} [zip=false}] [Zip output]
 * @return {BundledObject}              [Bundled items]
 */
module.exports = async (params) => {

  // Select the appropriate bundling type. For projects which do not require a backend,
  // e.g. no login or registration, then 'static' will suffice. Where a backend is
  // required, the bundler will produce an initialised npm project configured with
  // an express app structure.
  if (!params.projectType || params.projectType === "static") return await staticBundle(params);
  else if (params.projectType === "server") return await serverBundle(params);

};


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
