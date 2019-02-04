/**
 * Project bundler.
 *
 * Collects relevant assets, writes to the output directory and configures the
 * desired environment / context.
 *
 * @ Aaron Baw 2018.
 */

 const staticBundle = require('./staticBundle');
 const serverBundle = require('./serverBundle');

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
 const bundle = async (params) => {

   // Select the appropriate bundling type. For projects which do not require a backend,
   // e.g. no login or registration, then 'static' will suffice. Where a backend is
   // required, the bundler will produce an initialised npm project configured with
   // an express app structure.
   if (!params.projectType || params.projectType === "static") return await staticBundle(params);
   else if (params.projectType === "server") return await serverBundle(params);

 };

 module.exports = {
   bundle
 };

 // Logging.
 function log(...msg){
   if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
 }
