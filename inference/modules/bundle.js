/**
 * Project bundler.
 *
 * Collects relevant assets, writes to the output directory and configures the
 * desired environment / context.
 *
 * @ Aaron Baw 2018.
 */

const fs = require('fs');
const config = require('../config/config');
const { spawn, exec } = require('child_process');
const {resolve, join, basename} = require('path');
const resolvePath = resolve;
const glob = require('glob');

// Generate code to embed bundled assets in webpage.
function generateBundleEmbed(files){

  var cssFiles = files.filter(file => file.split('.')[1] == "css");
  var jsFiles = files.filter(file => file.split('.')[1] == "js");

  return {
    cssEmbed: cssFiles.reduce((prev, curr) => `<link rel="stylesheet" type="text/css" href="${curr}" />\n${prev}`, ""),
    jsEmbed:  jsFiles.reduce((prev, curr) => `<script src=${curr}></script>\n${prev}`, ""),
  }

}

module.exports = ({outputDir, context, imagePath, targets, zip=false}) => new Promise((resolve, reject) => {

  const projectName = outputDir.split('/')[outputDir.split('/').length - 1];

  var bundled = [];

  // Collect global assets for context.
  glob(join(__dirname, '../global')+`/*(${context}*.*|debug*.*)`, async (err, files) => {
    files.forEach(file => {
      log('Copying', file, 'to', outputDir+'/'+basename(file));

      var ext = file.split('.')[1];
      var outputFileName = file;

      // Rename files appropriately.
      // if (config.globalAssetMap[ext])
      //   outputFileName = `${config.globalAssetMap[ext]}.${ext}`

      // Register bundled asset.
      bundled.push(basename(outputFileName));

      fs.copyFileSync(file, outputDir+'/'+basename(outputFileName));
    });

    // Copy the image over to the bundle.
    fs.copyFileSync(imagePath, outputDir+'/'+basename(imagePath));
    bundled.push(basename(imagePath));

    bundled = {
      ...generateBundleEmbed(bundled),
      bgImagePath: basename(imagePath)
    };

    // Write files to outputDir.
    // log(targets);
    if (!Array.isArray(targets)) targets = [targets];
    // log(targets);

    targets.forEach(target => {

    // Add asset embeds.
    for (var assetType in bundled){
      target.source = target.source.replace(`{{${assetType}}}`, bundled[assetType]);
    }

    //   log(target);
    //   log(outputDir);
    //   log(`Writing`, resolve(__dirname, 'test.html'))
      fs.writeFileSync(outputDir+'/'+target.name, target.source);
    });

    // Zip project.
    if (zip) {
      log(`Zipping ${resolvePath(outputDir, '../')}.`);
      var zipCmd = spawn('zip', ['-r', `${projectName}/${projectName}.zip`, `./${projectName}`], {
        cwd: resolvePath(outputDir, '../')
      });
      zipCmd.on('close', () => resolve(bundled));
      zipCmd.on('stdout', data => log(data.toString()));
      // var zipProc = spaw(`zip ${outputDir}/${projectName}.zip ${outputDir}/*`);
    } else resolve(bundled);
  });

});


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
