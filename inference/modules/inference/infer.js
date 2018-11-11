/**
 * Inference pipeline for assigning properties about shapes for code generation.
 *
 *  @ Aaron Baw 2018
 */

const inferGrid = require('./inferGrid');
const inferType = require('./inferType');

// Infer properties about the shapes which will then be generated into HTML code.
module.exports = function inferProperties(shapes){

  // Infer grid information for containers representing rows.
  shapes.forEach(shape => {

    // Infer types.
    shape.type = inferType(shape);

    // Infer grids.
   shape = inferGrid(shape);
  });

  return shapes;
}
