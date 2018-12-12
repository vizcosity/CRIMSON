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
    // console.log('Checking if should keep', s.type, config.filter.indexOf(s.type) === -1);
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

  // Filter contained.
  shapes.contains = filterLevel(shapes.contains);

  // For each contained shape, recurse on their contained shapes.
  shapes = shapes.map(s => {
    return {...s, contains: filterPrimitives(s.contains)}
  });

  // console.log('filtered level', shapes);

  return shapes;
}

module.exports = filterPrimitives;
