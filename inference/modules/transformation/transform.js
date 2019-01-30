/**
 *  Transform agnostic representation of component hierarchy into a lower-level
 *  'preNode' representation, specific to the context being generated for.
 *
 *  Abstracts away the need to consider specific contexts such as a given
 *  component framework or library.
 *
 *  @ Aaron Baw 2018
 */

const BootstrapObject = require('./bootstrap/bootstrapObject');

module.exports = async function Transform (shape){
  // return new Promise((resolve, reject) => {
  //
  //   // Generate bootstrap object by default.
  //   return resolve(new BootstrapObject(shape));
  //
  // });
  return await BootstrapObject.create(shape);
}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`TRANSFORM |`, ...msg);
}
