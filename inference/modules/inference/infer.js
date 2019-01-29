/**
 * Inference pipeline for assigning properties about shapes for code generation.
 *
 *  @ Aaron Baw 2018
 */

const {inferGridAtLevel} = require('./inferGrid');
const { implicitlyNestIntoVerticalContainers, implicitlyNestIntoRows } = require('./implicitNest');
const { getLastACRObjectId, getACRObjectById, sortshapesAlongYAxis } = require('../geometry');
const {inferTypes} = require('./inferTypes');
const {inferCompoundPrimitives, inferCompoundPrimitivesAtLevel} = require('./inferCompound');

// Infer properties about the shapes which will then be generated into HTML code.
module.exports = function inferProperties(shapes){

  // Inference assumes that all the shapes have been sorted along the y axis,
  // according to their top-left most vertex. We sort them here to enforce
  // this constraint.
  shapes = sortshapesAlongYAxis(shapes);

  // Infer types.
  shapes = inferTypes(shapes);

  // Infer compound primitives, such as cards, heros, jumbotrons and media objects.
  // shapes = inferCompoundPrimitivesAtLevel(shapes);

  // Infer grid information for containers representing rows.
  // shapes.forEach(shape => {
  //
  //   log(`Inferring grid on`, shape.id);
  //
  //   // Infer grids.
  //   var { shape, lastShapeId } = inferGridAtLevel(shape, getLastACRObjectId(shapes));
  //   // shape.contains = inferGrid(shape, shape.contains, getLastACRObjectId(shapes));
  //   // shape.contains.forEach(shape => {
  //   //   shape = inferGrid(shape, getLastACRObjectId(shapes));
  //   // })
  //
  // });


  return shapes;
}

function log(...msg){
  if (process.env.DEBUG) console.log(`INFER |`, ...msg);
}
