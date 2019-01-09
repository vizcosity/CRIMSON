/**
 * Inference pipeline for assigning properties about shapes for code generation.
 *
 *  @ Aaron Baw 2018
 */

const inferGrid = require('./inferGrid');
const inferTypes = require('./inferTypes');

// Infer properties about the shapes which will then be generated into HTML code.
module.exports = function inferProperties(shapes){

  // Infer types.
  shapes = inferTypes(shapes);

  // Infer grid information for containers representing rows.
  shapes.forEach(shape => {

    // console.log(`Inferring grid.`);

    // Infer grids.
    shape = inferGrid(shape);

  });

  return shapes;
}
