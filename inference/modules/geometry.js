/**
 * Defines useful geometric functions such as sorting vertices and so on.
 *
 *  @ Aaron Baw 2018
 */

const getHighestY = shape => {
 var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
 return vertices.sort((a, b) => a[1] > b[1] ? -1 : 1)[0][1];
};

const getLowestY = shape => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
 return vertices.sort((a, b) => a[1] < b[1] ? -1 : 1)[0][1];
};

const getHighestX = shape => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
  return vertices.map(([x, _]) => x).sort((a,b) => a < b ? 1 : -1)[0];
};

const getLowestX = shape => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
  return vertices.map(([x, _]) => x).sort((a, b) => a > b ? 1 : -1)[0];
}

const calculateMidPoint = vertices => vertices.length !== 0 ? [
  vertices.map(([x, y]) => x).reduce((prev, curr) => prev + curr) / vertices.length,
  vertices.map(([x, y]) => y).reduce((prev, curr) => prev + curr) / vertices.length
] : [];

const sortShapesAlongXAxis = (shapes) => {
   return shapes.concat().sort((a, b) => a.meta.vertices[0][0] < b.meta.vertices[0][0] ? -1 : 1);
};

const sortshapesAlongYAxis = shapes => {
  return shapes.concat().sort((a, b) => a.meta.vertices[0][1] < b.meta.vertices[0][1] ? -1 : 1);
};

const sortShapesBySize = shapes => {
  return shapes.concat().sort((a, b) => a.meta.area > b.meta.area ? -1 : 1);
};

const doesVerticallyOverlap = (shape, otherShape) => {

  // log(`Checking if`, shape.id, shape.type, `vertically overlaps with`, otherShape.id, otherShape.type);

  if (getHighestX(shape) < getLowestX(otherShape)) {
    // log(getHighestX(shape), `lower than`, getLowestX(otherShape))
    return false;
  }

  if (getLowestX(shape) > getHighestX(otherShape)) {
    // log(getLowestX(shape), `greater than`, getHighestX(otherShape))

    return false;}

  // log(shape.id, shape.type, `vertically overlaps with`, otherShape.id, otherShape.type);


  return true;

};

// Returns true if the otherShape shares a horizontal overlapping with the
// 'shape'. Only returns true if the otherShape is shorter than the shape.
const doesHorizontallyOverlap = (shape, otherShape) => {

  // The highestY of the shape should not be below the lowestY of the other shape.
  if (getHighestY(shape) < getLowestY(otherShape)) return false;

  // The lowestY of the shape should not be above the highest Y of the other shape.
  if (getLowestY(shape) > getHighestY(otherShape)) return false;

  return true;

}

// Traverses the ACR to find the largest ID.
const getLastACRObjectId = acr => {

  // log(acr);

  if (!acr || acr.length === 0) return 0;

  var id = acr[0].id;

  acr.forEach(shape => {
    if (shape.id > id) id = shape.id;
    var largestContainedId = getLastACRObjectId(shape.contains);
    if (largestContainedId > id) id = largestContainedId;
  });

  return parseInt(id);

}

// Finds and returns an object in the ACR tree given an ID.
const getACRObjectById = (acr, id) => {

  if (!acr || acr.length == 0) return;

  for (var i in acr){
    var shape = acr[i];
    if (shape.id == id) return shape;
    var acrObjectWithinShape = findACRObjectById(shape.contains, id);
    if (acrObjectWithinShape) return acrObjectWithinShape;
  }

}

module.exports = {
  getLowestY,
  getHighestY,
  getLowestX,
  getHighestX,
  calculateMidPoint,
  sortShapesAlongXAxis,
  sortshapesAlongYAxis,
  sortShapesBySize,
  doesHorizontallyOverlap,
  doesVerticallyOverlap,
  getLastACRObjectId,
  getACRObjectById,
};

function log(...msg){
  if (process.env.DEBUG) console.log(`GEOMETRY |`, ...msg);
}
