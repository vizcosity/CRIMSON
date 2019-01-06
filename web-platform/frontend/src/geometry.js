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

  // TODO: Check if the primitive is within the parent container
  // before updating the vertices.


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

export {getRelativeDistance, findACRObjectById, moveACRObject, getUpperLeftmostVertex};
