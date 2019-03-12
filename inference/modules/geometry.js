/**
 * Defines useful geometric functions such as sorting vertices and so on.
 *
 *  @ Aaron Baw 2018
 */

// IOU calc implementation in JS for testing accuracy of detected containers.
const calcIou = (box, otherBox) => {
  var [[bx1, by1], bv2, [bx3, by3], bv4] = box;
  var [[ox1, oy1], ov2, [ox3, oy3], ov4] = otherBox;

  var i1 = [Math.max(bx1, ox1), Math.max(by1, oy1)];
  var i3 = [Math.min(bx3, ox3), Math.min(by3, oy3)];

  var intersectionVertices = [i1, [i1[0], i3[1]], i3, [i3[0], i1[1]]];

  var intersectionArea = Math.max((i3[1] - i1[1]), 0) * Math.max((i3[0] - i1[0]), 0);

  var boxArea = (by3 - by1) * (bx3 - bx1)

  var otherBoxArea = (oy3 - oy1) * (ox3 - ox1)

  // console.log(intersectionArea, boxArea, otherBoxArea);

  var iou = intersectionArea / (boxArea + otherBoxArea - intersectionArea);

  return iou;

}

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


module.exports = { getLowestY, getHighestY, getLowestX, getHighestX, sortShapesAlongXAxis, sortshapesAlongYAxis, sortShapesBySize, doesHorizontallyOverlap, doesVerticallyOverlap, getLastACRObjectId, getACRObjectById, calcIou };

function log(...msg){
  if (process.env.DEBUG) console.log(`GEOMETRY |`, ...msg);
}
