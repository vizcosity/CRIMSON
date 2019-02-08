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

// Creates npm project skeleton and moves files to appropriate target directory.
const createApplication = (name, dir) => {

  // Package
  var pkg = {
    name: name,
    version: '0.1.0',
    private: true,
    scripts: {
      start: 'node app.js'
    },
    dependencies: {
      "cookie-parser": "~1.4.3",
      "debug": "~2.6.9",
      "ejs": "~2.5.7",
      "express": "~4.16.0",
      "express-session": "^1.15.6",
      "http-errors": "~1.6.2",
      "morgan": "~1.9.0",
      "ejs": "^2.6.1",
      "passport": "^0.4.0",
      "local-ipv4-address": "0.0.2",
      "passport-local": "^1.0.0"
    }
  }

  // JavaScript
  var app = loadTemplate('js/app.js')
  var www = loadTemplate('js/www')

  // App name
  www.locals.name = name

  // App modules
  app.locals.localModules = Object.create(null)
  app.locals.modules = Object.create(null)
  app.locals.mounts = []
  app.locals.uses = []

  // Request logger
  app.locals.modules.logger = 'morgan'
  app.locals.uses.push("logger('dev')")
  pkg.dependencies.morgan = '~1.9.0'

  // Body parsers
  app.locals.uses.push('express.json()')
  app.locals.uses.push('express.urlencoded({ extended: false })')

  // Cookie parser
  app.locals.modules.cookieParser = 'cookie-parser'
  app.locals.uses.push('cookieParser()')
  pkg.dependencies['cookie-parser'] = '~1.4.3'

  if (dir !== '.') {
    mkdir(dir, '.')
  }

  mkdir(dir, 'public')
  mkdir(dir, 'public/javascripts')
  mkdir(dir, 'public/images')
  mkdir(dir, 'public/stylesheets')

  // copy css templates
  switch (program.css) {
    case 'less':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.less')
      break
    case 'stylus':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.styl')
      break
    case 'compass':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.scss')
      break
    case 'sass':
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.sass')
      break
    default:
      copyTemplateMulti('css', dir + '/public/stylesheets', '*.css')
      break
  }

  // copy route templates
  mkdir(dir, 'routes')
  copyTemplateMulti('js/routes', dir + '/routes', '*.js')

  if (program.view) {
    // Copy view templates
    mkdir(dir, 'views')
    pkg.dependencies['http-errors'] = '~1.6.2'
    switch (program.view) {
      case 'dust':
        copyTemplateMulti('views', dir + '/views', '*.dust')
        break
      case 'ejs':
        copyTemplateMulti('views', dir + '/views', '*.ejs')
        break
      case 'hbs':
        copyTemplateMulti('views', dir + '/views', '*.hbs')
        break
      case 'hjs':
        copyTemplateMulti('views', dir + '/views', '*.hjs')
        break
      case 'jade':
        copyTemplateMulti('views', dir + '/views', '*.jade')
        break
      case 'pug':
        copyTemplateMulti('views', dir + '/views', '*.pug')
        break
      case 'twig':
        copyTemplateMulti('views', dir + '/views', '*.twig')
        break
      case 'vash':
        copyTemplateMulti('views', dir + '/views', '*.vash')
        break
    }
  } else {
    // Copy extra public files
    copyTemplate('js/index.html', path.join(dir, 'public/index.html'))
  }

  // CSS Engine support
  switch (program.css) {
    case 'compass':
      app.locals.modules.compass = 'node-compass'
      app.locals.uses.push("compass({ mode: 'expanded' })")
      pkg.dependencies['node-compass'] = '0.2.3'
      break
    case 'less':
      app.locals.modules.lessMiddleware = 'less-middleware'
      app.locals.uses.push("lessMiddleware(path.join(__dirname, 'public'))")
      pkg.dependencies['less-middleware'] = '~2.2.1'
      break
    case 'sass':
      app.locals.modules.sassMiddleware = 'node-sass-middleware'
      app.locals.uses.push("sassMiddleware({\n  src: path.join(__dirname, 'public'),\n  dest: path.join(__dirname, 'public'),\n  indentedSyntax: true, // true = .sass and false = .scss\n  sourceMap: true\n})")
      pkg.dependencies['node-sass-middleware'] = '0.11.0'
      break
    case 'stylus':
      app.locals.modules.stylus = 'stylus'
      app.locals.uses.push("stylus.middleware(path.join(__dirname, 'public'))")
      pkg.dependencies['stylus'] = '0.54.5'
      break
  }

  // Index router mount
  app.locals.localModules.indexRouter = './routes/index'
  app.locals.mounts.push({ path: '/', code: 'indexRouter' })

  // User router mount
  app.locals.localModules.usersRouter = './routes/users'
  app.locals.mounts.push({ path: '/users', code: 'usersRouter' })

  // Template support
  switch (program.view) {
    case 'dust':
      app.locals.modules.adaro = 'adaro'
      app.locals.view = {
        engine: 'dust',
        render: 'adaro.dust()'
      }
      pkg.dependencies.adaro = '~1.0.4'
      break
    case 'ejs':
      app.locals.view = { engine: 'ejs' }
      pkg.dependencies.ejs = '~2.6.1'
      break
    case 'hbs':
      app.locals.view = { engine: 'hbs' }
      pkg.dependencies.hbs = '~4.0.1'
      break
    case 'hjs':
      app.locals.view = { engine: 'hjs' }
      pkg.dependencies.hjs = '~0.0.6'
      break
    case 'jade':
      app.locals.view = { engine: 'jade' }
      pkg.dependencies.jade = '~1.11.0'
      break
    case 'pug':
      app.locals.view = { engine: 'pug' }
      pkg.dependencies.pug = '2.0.0-beta11'
      break
    case 'twig':
      app.locals.view = { engine: 'twig' }
      pkg.dependencies.twig = '~0.10.3'
      break
    case 'vash':
      app.locals.view = { engine: 'vash' }
      pkg.dependencies.vash = '~0.12.4'
      break
    default:
      app.locals.view = false
      break
  }

  // Static files
  app.locals.uses.push("express.static(path.join(__dirname, 'public'))")

  if (program.git) {
    copyTemplate('js/gitignore', path.join(dir, '.gitignore'))
  }

  // sort dependencies like npm(1)
  pkg.dependencies = sortedObject(pkg.dependencies)

  // write files
  write(path.join(dir, 'app.js'), app.render())
  write(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  mkdir(dir, 'bin')
  write(path.join(dir, 'bin/www'), www.render(), MODE_0755)

  var prompt = launchedFromCmd() ? '>' : '$'

  if (dir !== '.') {
    console.log()
    console.log('   change directory:')
    console.log('     %s cd %s', prompt, dir)
  }

  console.log()
  console.log('   install dependencies:')
  console.log('     %s npm install', prompt)
  console.log()
  console.log('   run the app:')

  if (launchedFromCmd()) {
    console.log('     %s SET DEBUG=%s:* & npm start', prompt, name)
  } else {
    console.log('     %s DEBUG=%s:* npm start', prompt, name)
  }

  console.log()
}

const createPackageJSON = (projectName, nav) => {

  // Package
  var pkg = {
    name: projectName,
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

   if (code.nav) {
     var nav = loadTemplate('nav');
     nav.locals.code = code.nav;
     // render & write the nav view.
     fs.writeFileSync(join(outputDir, 'views', 'nav.ejs'), nav.render());
   }

   // Prepare the application.
   var packageJSON = createPackageJSON(projectName, projectType);
   var appJS = createEntryPoint(projectName, generateAuth, port);

   // Write the entry point & package json files.
   fs.writeFileSync(join(outputDir, 'package.json'), JSON.stringify(packageJSON, null, 2));
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
