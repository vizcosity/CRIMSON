/**
 * Set of functions to assisst geometric manipulation for customisation
 * of the ACR objects.
 *
 * @ Aaron Baw 2018
 */

 // Defines an interface for points, and sizes.
 export type Point = [number, number];

 export interface Size {
   height: number | string;
   width: number | string;
 };

 // Import the ACRObject type.
 import { ACRObject } from './ACR';
 
 // Converts absolute distances into relative values so that proportions
 // are maintained as we resize the window.
 function getRelativeDistance(parent: ACRObject, shape: ACRObject){
 
   if (typeof parent.meta.absoluteWidth === "string"){
     parent.meta.absoluteWidth = 1;
     parent.meta.absoluteHeight = 1;
   }
   
   const [ox, oy]: Point = getUpperLeftmostVertex(shape.meta.vertices);
   const [px, py]: Point = getUpperLeftmostVertex(parent.meta.vertices);
 
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
 
   return [left, top];
 
 }
 
 // /**
 //  * [converts absolute screen coordinates into relative bounding-box coordinates,
 //  * for a given bounding box at some position.]
 //  * absoluteCords: [x, y]
 //  * boundingBoxPosition: [x, y] (top-left vertex position)
 //  * @type [relX, relY]
 //  */
 // const convertAbsoluteToRelativeCoordinates = (absoluteCoords: Point, boundingBoxPosition: Point, boundingBoxSize: Size): Point => {
 //   let [absX, absY] = absoluteCoords;
 //   let [bbX, bbY] = boundingBoxPosition;
 //   let { width, height } = boundingBoxSize;
 
 //   // Ensure that the width and height are of type number, and not string.
 
 //   let relX = (absX - bbX) / width;
 //   let relY = (absY - bbY) / height;
 
 //   return [relX, relY]
 // }
 
 /**
  * [Converts global page coordinates into absolute bounding-box coordinates]
  * @param  {[Array]} globalCoords        [Array of [x, y] tuples]
  * @param  {[Tuple]} boundingBoxPosition [[x, y] top left position of the bounding box]
  * @param  {[Object]} boundingBoxSize     [{width, height} object contaiing the bounding box size}]
  * @return {[Tuple]}                     [Array tuple containing the bounding-box coordinates]
  */
 const convertGlobalToBoundingBoxCoordinates = (globalCoords: Point, boundingBoxPosition: Point): Point => {
   let [absX, absY] = globalCoords;
   let [bbX, bbY] = boundingBoxPosition
 
   return [
     absX - bbX,
     absY - bbY
   ]
 }
 
 // Finds and returns an object in the ACR tree given an ID.
 function findACRObjectById(acr, id: string){
 
   if (!acr || acr.length === 0) return;
 
   for (var i in acr){
     var shape = acr[i];
     if (shape.id === id) return shape;
     var acrObjectWithinShape = findACRObjectById(shape.contains, id);
     if (acrObjectWithinShape) return acrObjectWithinShape;
   }
 
 }
 
 // Given an ACR object and a change in x, y, translates the object.
 function moveACRObject({primitive}, dx: number, dy: number){
 
   // Generate updated vertex coordinates.
   var updatedVertices: Point[] = primitive.meta.vertices.map(([x, y]) => [x+dx, y+dy]);
 
   // Move all of the vertices & the midpoint.
   primitive.meta.vertices = updatedVertices
   primitive.meta.midpoint[0] += dx;
   primitive.meta.midpoint[1] += dy;
 
   // Move all containing primitives by the same amount, recursively.
   if (primitive.contains && primitive.contains.length > 0){
     primitive.contains.forEach(innerPrimitive => moveACRObject({
       primitive:innerPrimitive,
     }, dx, dy));
   }
 }
 
 // Grabs the upperleftmost vertex.
 function getUpperLeftmostVertex(vertices: Point[]): Point{
   return sortVertices(vertices)[0]
 }
 
 // Vertices passed to geometric functions may sometimes not be sorted. A rectangle's
 // vertices, for instance, must be ordered in the sequence [TOPLEFT, BOTTOMLEFT, BOTTOMRIGHT, TOPRIGHT].
 // The sort function below ensures consistency among the vertices defined for all
 // primitives manipulated by these functions.
 function sortVertices(vertices: Point[]): Point[] {
 
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
 function getLastACRObjectId(acr): number{
 
   if (!acr || acr.length === 0) return 0;
 
   var id = acr[0].id;
 
   acr.forEach(shape => {
     if (shape.id > id) id = shape.id;
     var largestContainedId = getLastACRObjectId(shape.contains);
     if (largestContainedId > id) id = largestContainedId;
   });
 
   return parseInt(id);
 
 }
 
 function resizeACRObject(primitive: ACRObject, parent: ACRObject, width: number, height: number){
 
   var dX = width - primitive.meta.absoluteWidth;
   var dY = height - primitive.meta.absoluteHeight;
 
   primitive.meta.absoluteHeight = height;
   primitive.meta.absoluteWidth = width;
 
   // Adjust the vertices.
   primitive.meta.vertices[1][1] += dY;
   primitive.meta.vertices[2][0] += dX;
   primitive.meta.vertices[2][1] += dY;
   primitive.meta.vertices[3][0] += dY;
 
   // console.log(`Primitive`, primitive.id, `parent:`, parent);
   // console.log(`Primitive height:`, height, `parent height:`, parent.meta.absoluteHeight);
 
   // Update the relative height and width. This must be a percentage relative to the
   // height and width of the parent, if the primitive has such a parent. For the case
   // where the parent id is the implicit canvas object, or there is no parnet, then
   // we use the absolute width and height values.
   //  primitive.meta.relativeHeight =  (parent && parent.id !== "canvas") ? `${(height / parent.meta.absoluteHeight) * 100}%` : `${height}px`;
   //  primitive.meta.relativeWidth = (parent && parent.id !== "canvas") ? `${(width / parent.meta.absoluteWidth) * 100}%` : `${width}px`;
 
  //  primitive.meta.relativeHeight = `${(height / parent.meta.absoluteHeight) * 100}%`;
  //  primitive.meta.relativeWidth = `${(width / parent.meta.absoluteWidth) * 100}%`;
  
  // No need to re-calculate the relative with and height values manually, as these 
  // are computed properties.
  // primitive.meta.relativeHeightValue = height / parent.meta.absoluteHeight;
  // primitive.meta.relativeWidthValue = width / parent.meta.absoluteWidth;

  console.log(primitive);
  console.log(`Set primitive relative height and width to:`, primitive.meta.relativeHeightValue, primitive.meta.relativeWidthValue)
  console.log(`Primitive relative height and width get values:`, primitive.meta.relativeHeight, primitive.meta.relativeWidth);

   // For each of the child primitives, we need to scale the position of the upper left most vertex by that of the width and height - so that 
   // when the user is resizing the primitive on screen, the contained shapes maintain their relative positions to that of their parents.
   // This will recursively call displace on all children contained. 
   // It's necessary to use the relative width and height values in order to ensure that we are taking into account the drawScaleFactor, as we need 
   //  to convert any absolute changes in width and height to account for the scale at which the objects are being displayed.
   primitive.contains.forEach(containedPrimitive => containedPrimitive.displace({
     x: dX*containedPrimitive.meta.relativeWidthValue, 
   y: dY*containedPrimitive.meta.relativeHeightValue
   }));

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

const getHighestY = (shape: Point[] | ACRObject): number => {
 var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
 return vertices.sort((a, b) => a[1] > b[1] ? -1 : 1)[0][1];
};

const getLowestY = (shape: Point[] | ACRObject): number => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
 return vertices.sort((a, b) => a[1] < b[1] ? -1 : 1)[0][1];
};

const getHighestX = (shape: Point[] | ACRObject): number => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
  return vertices.map(([x, _]) => x).sort((a,b) => a < b ? 1 : -1)[0];
};

const getLowestX = (shape: Point[] | ACRObject): number => {
  var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
  return vertices.map(([x, _]) => x).sort((a, b) => a > b ? 1 : -1)[0];
}

const calculateMidPoint = (vertices: Point[]): Point | [] => vertices.length !== 0 ? [
  vertices.map(([x, y]) => x).reduce((prev, curr) => prev + curr) / vertices.length,
  vertices.map(([x, y]) => y).reduce((prev, curr) => prev + curr) / vertices.length
] : [];

const sortShapesAlongXAxis = (shapes: ACRObject[]): ACRObject[] => {
   return shapes.concat().sort((a, b) => a.meta.vertices[0][0] < b.meta.vertices[0][0] ? -1 : 1);
};

const sortshapesAlongYAxis = (shapes: ACRObject[]): ACRObject[] => {
  return shapes.concat().sort((a, b) => a.meta.vertices[0][1] < b.meta.vertices[0][1] ? -1 : 1);
};

const sortShapesBySize = (shapes: ACRObject[]): ACRObject[] => {
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
 
export {
  getRelativeDistance,
  // convertAbsoluteToRelativeCoordinates,
  convertGlobalToBoundingBoxCoordinates,
  findACRObjectById,
  moveACRObject,
  getUpperLeftmostVertex,
  sortVertices,
  sortShapesVertically,
  sortShapesHorizontally,
  sortShapes,
  resizeACRObject,
  IDGenerator,
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
