/**
 * Infers type based off of shape metadata and context.
 *
 *  @ Aaron Baw 2018
 */
const config = require('../../config/config.json');

const getHighestY = shape => {
  var upperY = shape.meta.vertices[1][1];
  return upperY;
};

const getLowestY = shape => {
  var lowerY = shape.meta.vertices[3][1];
  return lowerY;
};

// const isRow = shape => {
//
//   // A row is a special case of a container, so shape must first be identified
//   // as a container before specialising.
//   if (shape.type != "container") return false;
//
//   // Check to see if the shape contains other objects along the same line
//   // in the horizontal axis.
//
//   // Find largest shape in the row.
//   var largestShape = shape.contains.concat().sort((a, b) => a.area > b.area)[0];
//
//   log(`Largest shape`, largestShape, `. Has contained : `, shape.contains.length !== 0);
//
//   // TODO: If shape is not a container, apply a convex hull around it to get the
//   // highest and lowest point. Assuming all shapes are containers for now.
//   var upperYBound = getHighestY(shape);
//   var lowerYBound = getLowestY(shape);
//
//   // For each shape, if any of the other contained shapes lie outside the boundary
//   // defined by the upper and lower coordinate of the largest shape, then
//   // we return false.
//   for (var i = 0; i < shape.contains.length; i++){
//     var shape = shape.contains[i];
//     if (getHighestY(shape) > upperYBound || getLowestY(shape) < lowerYBound)
//       return false;
//   }
//
//   return true;
//
// };

const isContainer = shape => {
  return shape.type == "row" || shape.type == "container";
}

// Navigation specification:
// Uppermost element which is of type container or derived.
const isNavigation = (shape, shapes) => {

  // If no shapes passed we can assume that this is the global window.
  if (shapes.length == 0) return false;

  // Find uppermost container.
  var upperMostContainer = shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] < b.meta.vertices[1][1])[0];

  log(shape.id, upperMostContainer);

  return upperMostContainer && (shape.id == upperMostContainer.id);
}

// Footer specification:
// Lowermost element which is of type container or derived.
const isFooter = (shape, shapes) => {

  // If no shapes passed we can assume that this is the global window.
  if (shapes.length == 0) return false;

  // Find uppermost container.
  var lowerMostContainer = shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] < b.meta.vertices[1][1]).reverse()[0];

  return lowerMostContainer && (shape.id == lowerMostContainer.id);
}

const isRow = shape => {

  // A row is a special case of a container, so shape must first be identified
  // as a container before specialising.
  if (shape.type != "container") return false;

  // For each shape contained, ensure that there is no vertical gaps between the current
  // shape and all other shapes.
  for (var i = 0; i < shape.contains.length; i++){
    for (var j = 0; j < shape.contains.length; j++){
      if (i == j) continue;
      // log(`${shape.contains[i].id}`,getHighestY(shape.contains[i]), `${shape.contains[i].id}`,getLowestY(shape.contains[i]));
      // log(getLowestY(shape.contains[j]), getHighestY(shape.contains[j]));



      // The highestY of the shape should not be below the lowestY of the other shape.
      if (getHighestY(shape.contains[i]) < getLowestY(shape.contains[j])) return false;

      // The lowestY of the shape should not be above the highest Y of the other shape.
      if (getLowestY(shape.contains[i]) > getHighestY(shape.contains[j])) return false;
    }

  }

  return true;

};

module.exports = (shape, shapes) => {

  shape.type = config.shapeMap[shape.type] ? config.shapeMap[shape.type] : shape.type;

  if (isRow(shape)) shape.type = "row";

  // if (isNavigation(shape, shapes)) shape.type = "navigation";
  // if (isFooter(shape, shapes)) shape.type = "footer";

  return shape.type;
}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`INFER TYPE |`, ...msg);
}
