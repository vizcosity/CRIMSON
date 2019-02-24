/**
 * 'Serer' project type bundler for CRIMSON projects.
 *
 * Creates an express application skeleton, ready for initialisation by virtue of
 * an npm package json.
 *
 * @ Aaron Baw 2019
 */

const { loadTemplate, generateBundleEmbed, copyContextFiles, createDirStructure, zipDir } = require('./bundleCommon');
const glob = require('glob');
const fs = require('fs');
const { join, basename, resolve } = require('path');
const ncp = require('ncp');
const resolvePath = resolve;
const crypto = require('crypto');
const dbConfigTemplate = require('./templates/db/config.json');

// Generate a collection name for the DB. We concatenate a random hash string
// to the end of the project name to avoid clashes.
const generateDBCollectionName = (projectName) => {
  var hash = crypto.randomBytes(12).toString('hex').slice(0, 12).toString('hex');
  return `${projectName}_${hash}`;
};

// Creates npm project skeleton and moves files to appropriate target directory.
const createPackageJSON = (projectName, nav) => {

  // Package
  var pkg = {
    name: projectName.replace(/ /g, '_'),
    version: '0.1.0',
    private: true,
    scripts: {
      start: 'node app.js'
    },
    dependencies: {
      "cookie-parser": "~1.4.3",
      "debug": "~2.6.9",
      "express": "~4.16.0",
      "local-ipv4-address": "0.0.2",
      "express-session": "^1.15.6",
      "mongodb": "^3.1.13",
      "http-errors": "~1.6.2",
      "morgan": "~1.9.0",
      "ejs": "^2.6.1"
    }
  }


  if (nav) pkg.dependencies = {
    ...pkg.dependencies,
    "passport": "^0.4.0",
    "passport-local": "^1.0.0"
  }

  return pkg;

}

const createDBConfig = projectName => {
  dbConfigTemplate.collectionName = generateDBCollectionName(projectName);
  return dbConfigTemplate;
}

const createEntryPoint = (projectName, generateAuth, port) => {

  var app = loadTemplate('../app.js');
  app.locals.projectName = projectName;
  app.locals.generateAuthRoutes = generateAuth;
  app.locals.port = port;

  return app.render();

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
const createExpressFiles = (outputDir) => new Promise((resolve, reject) => {
  // Copy routes (these will remain static for now; no need for editing).
  ncp(resolvePath(__dirname, 'templates', 'routes'), join(outputDir, 'routes'), function (err) {
   if (err) throw err;
   // Copy db.
   ncp(join(__dirname, 'templates', 'db'), join(outputDir, 'db'), err => {
     if (err) throw err;

     if (process.env.CRIMSON_GENERATE_AUTH)
     ncp(join(__dirname, 'templates', 'views'), join(outputDir, 'views'), err => {
       if (err) throw err;
       return resolve();
     });
     else return resolve();
   });
  });
});

var ports = {};
const getAvailablePort = (projectName) => {
  var portNum = 3500 + Object.keys(ports).length;
  ports[portNum] = projectName;
  return portNum;
}

const serverBundle = async ({
 outputDir,
 context,
 projectType,
 filteredACR,
 imagePath,
 code,
 navigation,
 file,
 fileName,
 package,
 port,
 generateAuth,
 zip=false
}) => {

   // Load 'index' and 'header' view templates.
   var index = loadTemplate('index');
   var header = loadTemplate('header');
   var scripts = loadTemplate('scripts');

   var locals = {};

   log(`GenerateAuth:`,generateAuth);

   locals.code = code.index;
   locals.package = package;
   locals.projectType = projectType;
   locals.context = context;
   locals.file = file;
   locals.package = package;
   locals.fileName = fileName;
   locals.imagePath = imagePath;

   // log(`Index locals:`, index.locals);

   var contextFiles = await copyContextFiles(context, projectType, outputDir);
   await createExpressFiles(outputDir);

   const projectName = outputDir.split('/')[outputDir.split('/').length - 1];

   if (!port) port = getAvailablePort(projectName);

   log(`Bundling server project`, projectName);
   log(`imagePath`, imagePath);
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
     locals[assetType] = bundled[assetType];
   }

   // Share locals between the index and header views.
   for (var local in locals){
     header.locals[local] = locals[local];
     index.locals[local] = locals[local];
     scripts.locals[local] = locals[local];
   };

   // Render & write the index view.
   fs.writeFileSync(join(outputDir, 'views', 'index.ejs'), index.render());

   // Render & write the header view.
   fs.writeFileSync(join(outputDir, 'views', 'header.ejs'), header.render());

   // Render & write the scripts view.
   fs.writeFileSync(join(outputDir, 'views', 'scripts.ejs'), scripts.render());

   var nav = loadTemplate('nav');
   nav.locals.code = code && code.nav ? code.nav : "";
   // render & write the nav view.
   fs.writeFileSync(join(outputDir, 'views', 'nav.ejs'), nav.render());

   // Prepare the application.
   var packageJSON = createPackageJSON(projectName, projectType);
   var dbConfig = createDBConfig(projectName);
   var appJS = createEntryPoint(projectName, generateAuth, port);

   // Write the entry point & package json files.
   fs.writeFileSync(join(outputDir, 'package.json'), JSON.stringify(packageJSON, null, 2));
   fs.writeFileSync(join(outputDir, 'db', 'config.json'), JSON.stringify(dbConfig, null, 2));
   fs.writeFileSync(join(outputDir, 'app.js'), appJS, 'utf8');

   // Zip project.
   if (zip) return zipDir(projectName, outputDir);
   else return bundled;

};

module.exports = serverBundle;

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
