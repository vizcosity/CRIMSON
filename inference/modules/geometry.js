"use strict";
/**
 * Set of functions to assisst geometric manipulation for customisation
 * of the ACR objects.
 *
 * @ Aaron Baw 2018
 */
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
;
// Converts absolute distances into relative values so that proportions
// are maintained as we resize the window.
function getRelativeDistance(parent, shape) {
    if (typeof parent.meta.absoluteWidth === "string") {
        parent.meta.absoluteWidth = 1;
        parent.meta.absoluteHeight = 1;
    }
    var _a = getUpperLeftmostVertex(shape.meta.vertices), ox = _a[0], oy = _a[1];
    var _b = getUpperLeftmostVertex(parent.meta.vertices), px = _b[0], py = _b[1];
    var absX = ox - px;
    var absY = oy - py;
    // Distance as a proportion of the parent's width and height.
    var left = (absX / parent.meta.absoluteWidth) * 100;
    var top = (absY / parent.meta.absoluteHeight) * 100;
    // if (shape.id == "13") console.log(shape);
    //
    // console.log("Parent", parent.id, px, py);
    // console.log('Shape', shape.id, ox, oy);
    // console.log(absX, absY, left, top);
    return [left, top];
}
exports.getRelativeDistance = getRelativeDistance;
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
var convertGlobalToBoundingBoxCoordinates = function (globalCoords, boundingBoxPosition) {
    var absX = globalCoords[0], absY = globalCoords[1];
    var bbX = boundingBoxPosition[0], bbY = boundingBoxPosition[1];
    return [
        absX - bbX,
        absY - bbY
    ];
};
exports.convertGlobalToBoundingBoxCoordinates = convertGlobalToBoundingBoxCoordinates;
// Finds and returns an object in the ACR tree given an ID.
function findACRObjectById(acr, id) {
    if (!acr || acr.length === 0)
        return;
    for (var i in acr) {
        var shape = acr[i];
        if (shape.id === id)
            return shape;
        var acrObjectWithinShape = findACRObjectById(shape.contains, id);
        if (acrObjectWithinShape)
            return acrObjectWithinShape;
    }
}
exports.findACRObjectById = findACRObjectById;
// Given an ACR object and a change in x, y, translates the object.
function moveACRObject(_a, dx, dy) {
    var primitive = _a.primitive;
    // Generate updated vertex coordinates.
    var updatedVertices = primitive.meta.vertices.map(function (_a) {
        var x = _a[0], y = _a[1];
        return [x + dx, y + dy];
    });
    // Move all of the vertices & the midpoint.
    primitive.meta.vertices = updatedVertices;
    primitive.meta.midpoint[0] += dx;
    primitive.meta.midpoint[1] += dy;
    // Move all containing primitives by the same amount, recursively.
    if (primitive.contains && primitive.contains.length > 0) {
        primitive.contains.forEach(function (innerPrimitive) { return moveACRObject({
            primitive: innerPrimitive,
        }, dx, dy); });
    }
}
exports.moveACRObject = moveACRObject;
// Grabs the upperleftmost vertex.
function getUpperLeftmostVertex(vertices) {
    return sortVertices(vertices)[0];
}
exports.getUpperLeftmostVertex = getUpperLeftmostVertex;
// Vertices passed to geometric functions may sometimes not be sorted. A rectangle's
// vertices, for instance, must be ordered in the sequence [TOPLEFT, BOTTOMLEFT, BOTTOMRIGHT, TOPRIGHT].
// The sort function below ensures consistency among the vertices defined for all
// primitives manipulated by these functions.
function sortVertices(vertices) {
    // Keep vertices as they are if we are not dealing with rectangles.
    // (Assume that the shapes defined by these vertices conform to the
    // same spec)
    if (vertices.length !== 4)
        return vertices;
    var radixSorted = vertices.sort(function (_a, _b) {
        var x1 = _a[0], y1 = _a[1];
        var x2 = _b[0], y2 = _b[1];
        return (x1 - x2) + (y1 - y2);
    });
    // Geometrically, radix sort does not have a meaning. We swap the 3rd and 4th
    // vertices so that we conform to the vertex specification outlined above.
    var output = Array.from(radixSorted);
    output[2] = radixSorted[3];
    output[3] = radixSorted[2];
    return output;
}
exports.sortVertices = sortVertices;
// Traverses the ACR to find the largest ID.
function getLastACRObjectId(acr) {
    if (!acr || acr.length === 0)
        return 0;
    var id = acr[0].id;
    acr.forEach(function (shape) {
        if (shape.id > id)
            id = shape.id;
        var largestContainedId = getLastACRObjectId(shape.contains);
        if (largestContainedId > id)
            id = largestContainedId;
    });
    return parseInt(id);
}
exports.getLastACRObjectId = getLastACRObjectId;
function resizeACRObject(primitive, parent, width, height) {
    var dX = width - primitive.meta.absoluteWidth;
    var dY = height - primitive.meta.absoluteHeight;
    var widthPercentageChange = width / primitive.meta.absoluteWidth;
    var heightPercentageChange = height / primitive.meta.absoluteHeight;
    primitive.contains.forEach(function (containedPrimitive) {
        resizeACRObject(containedPrimitive, primitive, width * containedPrimitive.meta.relativeWidthValue, height * containedPrimitive.meta.relativeHeightValue);
        //  primitive.contains.forEach(containedPrimitive => containedPrimitive.displace({
        //   x: dX*containedPrimitive.meta.relativeWidthValue, 
        //   y: dY*containedPrimitive.meta.relativeHeightValue
        //  }));  
    });
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
    console.log("Set primitive relative height and width to:", primitive.meta.relativeHeightValue, primitive.meta.relativeWidthValue);
    console.log("Primitive relative height and width get values:", primitive.meta.relativeHeight, primitive.meta.relativeWidth);
    // For each of the child primitives, we need to scale the position of the upper left most vertex by that of the width and height - so that 
    // when the user is resizing the primitive on screen, the contained shapes maintain their relative positions to that of their parents.
    // This will recursively call displace on all children contained. 
    // It's necessary to use the relative width and height values in order to ensure that we are taking into account the drawScaleFactor, as we need 
    //  to convert any absolute changes in width and height to account for the scale at which the objects are being displayed.
    //  primitive.contains.forEach(containedPrimitive => containedPrimitive.displace({
    //    x: dX*containedPrimitive.meta.relativeWidthValue * widthPercentageChange, 
    //    y: dY*containedPrimitive.meta.relativeHeightValue * heightPercentageChange
    //  }));    
    //  console.log(widthPercentageChange, heightPercentageChange);
}
exports.resizeACRObject = resizeACRObject;
// Sorts shapes in order of their vertical positions before requesting generated
// code.
function sortShapesVertically(shapes) {
    if (!shapes || shapes.length === 0)
        return shapes;
    shapes.forEach(function (shape) { return shape.contains = sortShapesVertically(shape.contains); });
    shapes = shapes.sort(function (a, b) { return a.meta.midpoint[1] < b.meta.midpoint[1] ? -1 : 1; });
    return shapes;
}
exports.sortShapesVertically = sortShapesVertically;
function sortShapesHorizontally(shapes) {
    if (!shapes || shapes.length === 0)
        return shapes;
    shapes.forEach(function (shape) { return shape.contains = sortShapesHorizontally(shape.contains); });
    shapes = shapes.sort(function (a, b) { return a.meta.midpoint[2] < b.meta.midpoint[2] ? -1 : 1; });
    return shapes;
}
exports.sortShapesHorizontally = sortShapesHorizontally;
// Sorts shapes vertically and horizontally before requesting code.
function sortShapes(shapes) {
    return sortShapesVertically(sortShapesHorizontally(shapes));
}
exports.sortShapes = sortShapes;
// Generates new shape IDs used for manual primitive creation.
function IDGenerator(shapes) {
    this.nextId = getLastACRObjectId(shapes) + 1;
    this.newId = function () {
        return this.nextId++;
    };
}
exports.IDGenerator = IDGenerator;
var getHighestY = function (shape) {
    var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
    return vertices.sort(function (a, b) { return a[1] > b[1] ? -1 : 1; })[0][1];
};
exports.getHighestY = getHighestY;
var getLowestY = function (shape) {
    var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
    return vertices.sort(function (a, b) { return a[1] < b[1] ? -1 : 1; })[0][1];
};
exports.getLowestY = getLowestY;
var getHighestX = function (shape) {
    var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
    return vertices.map(function (_a) {
        var x = _a[0], _ = _a[1];
        return x;
    }).sort(function (a, b) { return a < b ? 1 : -1; })[0];
};
exports.getHighestX = getHighestX;
var getLowestX = function (shape) {
    var vertices = Array.isArray(shape) ? shape : shape.meta.vertices;
    return vertices.map(function (_a) {
        var x = _a[0], _ = _a[1];
        return x;
    }).sort(function (a, b) { return a > b ? 1 : -1; })[0];
};
exports.getLowestX = getLowestX;
var calculateMidPoint = function (vertices) { return vertices.length !== 0 ? [
    vertices.map(function (_a) {
        var x = _a[0], y = _a[1];
        return x;
    }).reduce(function (prev, curr) { return prev + curr; }) / vertices.length,
    vertices.map(function (_a) {
        var x = _a[0], y = _a[1];
        return y;
    }).reduce(function (prev, curr) { return prev + curr; }) / vertices.length
] : []; };
exports.calculateMidPoint = calculateMidPoint;
var sortShapesAlongXAxis = function (shapes) {
    return shapes.concat().sort(function (a, b) { return a.meta.vertices[0][0] < b.meta.vertices[0][0] ? -1 : 1; });
};
exports.sortShapesAlongXAxis = sortShapesAlongXAxis;
var sortshapesAlongYAxis = function (shapes) {
    return shapes.concat().sort(function (a, b) { return a.meta.vertices[0][1] < b.meta.vertices[0][1] ? -1 : 1; });
};
exports.sortshapesAlongYAxis = sortshapesAlongYAxis;
var sortShapesBySize = function (shapes) {
    return shapes.concat().sort(function (a, b) { return a.meta.area > b.meta.area ? -1 : 1; });
};
exports.sortShapesBySize = sortShapesBySize;
var doesVerticallyOverlap = function (shape, otherShape) {
    // log(`Checking if`, shape.id, shape.type, `vertically overlaps with`, otherShape.id, otherShape.type);
    if (getHighestX(shape) < getLowestX(otherShape)) {
        // log(getHighestX(shape), `lower than`, getLowestX(otherShape))
        return false;
    }
    if (getLowestX(shape) > getHighestX(otherShape)) {
        // log(getLowestX(shape), `greater than`, getHighestX(otherShape))
        return false;
    }
    // log(shape.id, shape.type, `vertically overlaps with`, otherShape.id, otherShape.type);
    return true;
};
exports.doesVerticallyOverlap = doesVerticallyOverlap;
// Returns true if the otherShape shares a horizontal overlapping with the
// 'shape'. Only returns true if the otherShape is shorter than the shape.
var doesHorizontallyOverlap = function (shape, otherShape) {
    // The highestY of the shape should not be below the lowestY of the other shape.
    if (getHighestY(shape) < getLowestY(otherShape))
        return false;
    // The lowestY of the shape should not be above the highest Y of the other shape.
    if (getLowestY(shape) > getHighestY(otherShape))
        return false;
    return true;
};
exports.doesHorizontallyOverlap = doesHorizontallyOverlap;
// Finds and returns an object in the ACR tree given an ID.
var getACRObjectById = function (acr, id) {
    if (!acr || acr.length == 0)
        return;
    for (var i in acr) {
        var shape = acr[i];
        if (shape.id == id)
            return shape;
        var acrObjectWithinShape = findACRObjectById(shape.contains, id);
        if (acrObjectWithinShape)
            return acrObjectWithinShape;
    }
};
exports.getACRObjectById = getACRObjectById;
function log() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    if (process.env.DEBUG)
        console.log.apply(console, __spreadArrays(["GEOMETRY |"], msg));
}
