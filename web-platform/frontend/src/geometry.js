/**
 * Set of functions to assisst geometric manipulation for customisation
 * of the ACR objects.
 *
 * @ Aaron Baw 2018
 */

// Converts absolute distances into relative values so that proportions
// are maintained as we resize the window.
function getRelativeDistance(parent, shape){

  if (typeof parent.meta.absoluteWidth == "string"){
    parent.meta.absoluteWidth = 1;
    parent.meta.absoluteHeight = 1;
  }

  const [ox, oy] = getUpperLeftmostVertex(shape.meta.vertices);
  const [px, py] = getUpperLeftmostVertex(parent.meta.vertices);

  const absX = ox - px;
  const absY = oy - py;

  // Distance as a proportion of the parent's width and height.
  const left = (absX / parent.meta.absoluteWidth) * 100;
  const top = (absY / parent.meta.absoluteHeight) * 100;


  // if (shape.id == "13") console.log(shape);
  //
  // console.log("Parent", parent.id, px, py);
  // console.log('Shape', shape.id, ox, oy);
  // console.log(absX, absY, left, top);

  return {left, top};

}

// Finds and returns an object in the ACR tree given an ID.
function findACRObjectById(acr, id){

  if (!acr || acr.length == 0) return;

  for (var i in acr){
    var shape = acr[i];
    if (shape.id == id) return shape;
    var acrObjectWithinShape = findACRObjectById(shape.contains, id);
    if (acrObjectWithinShape) return acrObjectWithinShape;
  }

}

// Given an ACR object and a change in x, y, translates the object.
function moveACRObject({primitive, parent}, dx, dy){

  // Generate updated vertex coordinates.
  var updatedVertices = primitive.meta.vertices.map(([x, y]) => [x+dx, y+dy]);

  // Move all of the vertices & the midpoint.
  primitive.meta.vertices = updatedVertices
  primitive.meta.midpoint[0] += dx;
  primitive.meta.midpoint[1] += dy;

  // Move all containing primitives by the same amount, recursively.
  if (primitive.contains && primitive.contains.length > 0){
    primitive.contains.forEach(innerPrimitive => moveACRObject({primitive:innerPrimitive, parent:primitive}, dx, dy));
  }
}

// Grabs the upperleftmost vertex.
function getUpperLeftmostVertex(vertices){
  return sortVertices(vertices)[0]
}

// Vertices passed to geometric functions may sometimes not be sorted. A rectangle's
// vertices, for instance, must be ordered in the sequence [TOPLEFT, BOTTOMLEFT, BOTTOMRIGHT, TOPRIGHT].
// The sort function below ensures consistency among the vertices defined for all
// primitives manipulated by these functions.
function sortVertices(vertices){

  // Keep vertices as they are if we are not dealing with rectangles.
  // (Assume that the shapes defined by these vertices conform to the
  // same spec)
  if (vertices.length !== 4) return vertices;

  var radixSorted = vertices.sort(([x1, y1], [x2, y2]) => (x1 - x2) + (y1 - y2));

  // Geometrically, radix sort does not have a meaning. We swap the 3rd and 4th
  // vertices so that we conform to the vertex specification outlined above.
  var output = Array.from(radixSorted);
  output[2] = radixSorted[3];
  output[3] = radixSorted[2];

  return output;

}

// Traverses the ACR to find the largest ID.
function getLastACRObjectId(acr){

  if (!acr || acr.length === 0) return 0;

  var id = acr[0].id;

  acr.forEach(shape => {
    if (shape.id > id) id = shape.id;
    var largestContainedId = getLastACRObjectId(shape.contains);
    if (largestContainedId > id) id = largestContainedId;
  });

  return parseInt(id);

}

function resizeACRObject(primitive, parent, width, height){

  var dX = width - primitive.meta.absoluteWidth;
  var dY = height - primitive.meta.absoluteHeight;

  var parentWidth = parent.meta.absoluteWidth;
  var parentHeight = parent.meta.absoluteHeight;

  primitive.meta.absoluteHeight = height;
  primitive.meta.absoluteWidth = width;

  // Adjust the vertices.
  primitive.meta.vertices[1][1] += dY;
  primitive.meta.vertices[2][0] += dX;
  primitive.meta.vertices[2][1] += dY;
  primitive.meta.vertices[3][0] += dY;

  // console.log(`Primitive`, primitive.id, `parent:`, parent);
  // console.log(`Primitive height:`, height, `parent height:`, parent.meta.absoluteHeight);

  // Update the relative height and width.
  primitive.meta.relativeHeight = parent.id !== "canvas" ? `${(height / parentHeight) * 100}%` : `${height}px`;
  primitive.meta.relativeWidth = parent.id !== "canvas" ? `${(width / parentWidth) * 100}%` : `${width}px`;

}

// Sorts shapes in order of their vertical positions before requesting generated
// code.
function sortShapesVertically(shapes){

  if (!shapes || shapes.length === 0) return shapes;

  shapes.forEach(shape => shape.contains = sortShapesVertically(shape.contains));

  shapes = shapes.sort((a, b) => a.meta.midpoint[1] < b.meta.midpoint[1] ? -1 : 1);

  return shapes;
}

function sortShapesHorizontally(shapes){

  if (!shapes || shapes.length === 0) return shapes;

  shapes.forEach(shape => shape.contains = sortShapesHorizontally(shape.contains));

  shapes = shapes.sort((a, b) => a.meta.midpoint[2] < b.meta.midpoint[2] ? -1 : 1);

  return shapes;

}

// Sorts shapes vertically and horizontally before requesting code.
function sortShapes(shapes){
  return sortShapesVertically(sortShapesHorizontally(shapes));
}

// Generates new shape IDs used for manual primitive creation.
function IDGenerator(shapes){

  this.nextId = getLastACRObjectId(shapes) + 1;

  this.newId = function(){
    return this.nextId++;
  }


}

export {
  getRelativeDistance,
  findACRObjectById,
  moveACRObject,
  getUpperLeftmostVertex,
  sortVertices,
  sortShapesVertically,
  sortShapesHorizontally,
  sortShapes,
  getLastACRObjectId,
  resizeACRObject,
  IDGenerator
};
