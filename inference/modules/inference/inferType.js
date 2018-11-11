/**
 * Infers type based off of shape metadata and context.
 *
 *  @ Aaron Baw 2018
 */

const config = require('../../config/config.json');

const isRow = shape => {

  if (shape.container != "container") return false;

  // Check to see if the shape contains other objects along the same line
  // in the horizontal axis.


};

module.exports = (shape) => {
  shape.type = config.shapeMap[shape.type] ? config.shapeMap[shape.type] : shape.type;

  return shape.type;
}
