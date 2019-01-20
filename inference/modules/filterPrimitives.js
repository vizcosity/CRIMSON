/**
 * Filters unwanted primitives leftover from inference.
 *
 * @ Aaron Baw 2018
 */

const config = require('../config/config');

function filterLevel(shapes){
  if (!shapes) return shapes;
  // console.log('shapes', shapes);
  return shapes.filter(s => {
    return config.filter.indexOf(s.type) === -1
  });

  var output = [];
  shapes.forEach(shape => {
    if (config.filter.indexOf(shape.type) === -1) output.push(shape);
  });
  return output;
}

function filterPrimitives(shapes){
  if (!shapes || shapes.length === 0) return shapes;
  // console.log('about to filter',shapes);
  // Filter current level.
  shapes = filterLevel(shapes);

  // console.log(`Shapes:`, shapes.contains.length);
  //
  // // Filter contained.
  // shapes.contains = filterLevel(shapes.contains);
  //
  // console.log(`NUm shapes after filtering:`, shapes.contains.length);

  // For each contained shape, recurse on their contained shapes.
  shapes = shapes.map(s => {
    return {...s, contains: filterPrimitives(s.contains)}
  });

  return shapes;
}

// Adds a field 'draw' equal to true to indicate that the primitive should be
// displayed by the ACR customisation tool.
function markDisplayablePrimitives(shapes){

  if (!shapes || shapes.length === 0) return shapes;

  shapes = shapes.map(shape => {
    shape.contains = markDisplayablePrimitives(shape.contains);
    shape.draw = !config.filter.includes(shape.type);
    return shape;
  });

  return shapes;
}

module.exports = {filterPrimitives, markDisplayablePrimitives};
