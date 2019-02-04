/**
 * Static bundling for CRIMSON project files.
 *
 * @ Aaron Baw 2019
 */

const { generateBundleEmbed, loadTemplate, copyContextFiles, createDirStructure } = require('./bundleCommon');
const {resolve, join, basename} = require('path');
const fs = require('fs');
const resolvePath = resolve;

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

   index.locals.code = code.index;
   index.locals.projectType = projectType;
   index.locals.context = context;
   index.locals.file = file;
   index.locals.package = package;
   index.locals.fileName = fileName;
   index.locals.imagePath = imagePath;

   var contextFiles = await copyContextFiles(context, projectType, outputDir);

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

   if (projectType === 'server' && code.nav) {
     var nav = loadTemplate('nav');
     nav.locals.code = code.nav;
     // render & write the nav view.
     fs.writeFileSync(join(outputDir, 'views', 'nav.ejs'), nav.render());
   }

   // Render & write the index file.
   fs.writeFileSync(join(outputDir, 'index.html'), index.render());

   // Zip project.
   if (zip) return zipDir(projectName, outputDir);
   else return bundled;
};

module.exports = staticBundle;


// Logging.
function log(...msg){
 if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
