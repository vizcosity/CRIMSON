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

module.exports = ({outputDir, context, targets, zip=false}) => new Promise((resolve, reject) => {

  const projectName = outputDir.split('/')[outputDir.split('/').length - 1];

  // Collect global assets for context.
  glob(join(__dirname, '../global')+'/'+context+'.*', async (err, files) => {
    files.forEach(file => {
      // log('Copying', file, 'to', outputDir+'/'+basename(file));

      var ext = file.split('.')[1];
      var outputFileName = file;

      // Rename files appropriately.
      if (config.globalAssetMap[ext])
        outputFileName = `${config.globalAssetMap[ext]}.${ext}`

      fs.copyFileSync(file, outputDir+'/'+basename(outputFileName));
    });

    // Write files to outputDir.
    // log(targets);
    if (!Array.isArray(targets)) targets = [targets];
    // log(targets);

    targets.forEach(target => {
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
      zipCmd.on('close', () => resolve());
      zipCmd.on('stdout', data => log(data.toString()));
      // var zipProc = spaw(`zip ${outputDir}/${projectName}.zip ${outputDir}/*`);
    } else resolve();
  });

});


// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
