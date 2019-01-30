/**
 * Composition of certain UI components may require that they be nested implicitly
 * within some container. For example, multiple elements distributed along
 * the same vertical point would need to be nested within within separate
 * containers, as well as being nested as a group within a row container.
 * This would then allow the grid inference module to distribute the
 * components appropriately along the horizontal axis.
 *
 * @ Aaron Baw 2018
 */

const { getHighestX, getLowestX, getHighestY, getLowestY, doesHorizontallyOverlap, doesVerticallyOverlap, getLastACRObjectId, sortshapesAlongYAxis } = require('../geometry.js');
const { Container, Row } = require('../ACR.js');
const { padding } = require('../../config/config.json');

// Utility methods.
function shapeArraysEqual(shapes, otherShapes){
  if (shapes.length !== otherShapes.length) return false;
  shapes = shapes.map(s => s.id).sort((a, b) => a > b ? 1 : -1);
  otherShapes = otherShapes.map(s => s.id).sort((a, b) => a > b ? 1 : -1);
  for (var i = 0; i < shapes.length; i++){
    if (shapes[i] !== otherShapes[i]) return false;
  }
  return true;
}

// Given the lastId, shapes at current level, and a parent object, nests all
// of the objects within a container which share a vertically overalpping portion
// with the widest shape.
function implicitlyNestIntoVerticalContainers(lastId, shapesAtLevel, parent){

  if (!shapesAtLevel || shapesAtLevel.length === 0) return shapesAtLevel;

  log(`Implicitly nesting ${shapesAtLevel.length} shapes into vertical containers at level`, shapesAtLevel[0].level);

  var shapesByWidth = shapesAtLevel.sort((a, b) => a.meta.absoluteWidth < b.meta.absoluteWidth ? 1 : -1);

  // log(`Sorted by width`, shapesByWidth);

  var widestShape = shapesByWidth[0];

  // log(`Widest shape`, widestShape);

  // log(`Widest shape (${widestShape.meta.absoluteWidth}) is ${widestShape.id}`);

  // Create a buffer which will store all the shapes we will be adding to the
  // container. We need to do this because we can't create the container until
  // we know how tall and wide it needs to be.
  var containerBuffer = [];
  containerBuffer.push(widestShape);

  // Nest all shapes which share a vertical overlapping with the widest shape.
  shapesAtLevel.filter(s => s.id !== widestShape.id).forEach(shape => {
    if (doesVerticallyOverlap(widestShape, shape)){
      containerBuffer.push(shape);
    }

    // Recursively nest child primitives.
    shape.contains = implicitlyNestIntoVerticalContainers(lastId, shape.contains, shape);

  });

  // We only want to nest shapes if they are not already adequately nested. We can
  // test for this by comparing the containerBuffer to the shapes which are contained
  // by the parent of the current shape level. If they match, then we can infer
  // that the shapes have already been nested, and return them as they are.
  if (shapeArraysEqual(containerBuffer, parent.contains)){
    log(`Refusing to nest ${containerBuffer.length} children of ${parent.id} as container would match parent.`);
     return shapesAtLevel;
   }


  // Find the height and width of the container.
  var allVertices = containerBuffer.map(shape => shape.meta.vertices).flat();

  var containerHeight = getHighestY(allVertices) - getLowestY(allVertices) + padding;
  var containerWidth = getHighestX(allVertices) - getLowestX(allVertices) + padding;

  // // Create the container object.
  var container = new Container({
    id: ++lastId,
    midpoint: parent.meta.midpoint,
    height: containerHeight,
    width: containerWidth,
    level: parent.level + 1,
    parent: parent
  });

  // Add container buffer shapes to container.
  containerBuffer.forEach(shape => {
    // log(`Adding ${shape.id} to the container buffer.`);
    container.addContainingShape(shape);
    // Remove the shape we add from the shapesAtLevel array.
    shapesAtLevel = shapesAtLevel.filter(s => s.id !== shape.id);
    // log(`Removing ${shape.id} from the current level, as it is in the container.`);
  });

  // Add the container to the array of shapes at the current level.
  shapesAtLevel.push(container);

  return shapesAtLevel;
}

function implicitlyNestHorizontallyWithRespectToShape(currentShape, shapesAtLevel, lastId, parent){
  // Create a buffer which will store all the shapes we will be adding to the
  // container. We need to do this because we can't create the container until
  // we know how tall and wide it needs to be.
  var rowBuffer = [];
  rowBuffer.push(currentShape);

  // Nest all shapes which share a vertical overlapping with the widest shape.
  shapesAtLevel.filter(s => s.id !== currentShape.id).forEach(shape => {
    if (doesHorizontallyOverlap(currentShape, shape)){
      rowBuffer.push(shape);
    }

    // Recursively nest child primitives.
    shape.contains = implicitlyNestIntoRows(lastId, shape.contains, shape);

  });

  // We only want to nest shapes if they are not already adequately nested. We can
  // test for this by comparing the containerBuffer to the shapes which are contained
  // by the parent of the current shape level. If they match, then we can infer
  // that the shapes have already been nested, and return them as they are.
  if (shapeArraysEqual(rowBuffer, parent.contains)) {
    log(`Refusing to nest ${rowBuffer.length} children of ${parent.id} as container would match parent.`);
    return shapesAtLevel;
  }

  // Find the height and width of the container.
  var allVertices = rowBuffer.map(shape => shape.meta.vertices).flat();
  var rowHeight = getHighestY(allVertices) - getLowestY(allVertices) + padding;
  var rowWidth = getHighestX(allVertices) - getLowestX(allVertices) + padding;

  // // Create the container object.
  var row = new Row({
    id: ++lastId,
    midpoint: parent.meta.midpoint,
    height: rowHeight,
    width: rowWidth,
    level: parent.level + 1,
    parent: parent
  });

  // Add container buffer shapes to container.
  rowBuffer.forEach(shape => {
    row.addContainingShape(shape);
    // Remove the shape from the current level, since it is being nested.
    shapesAtLevel = shapesAtLevel.filter(s => s.id !== shape.id);
  });

  // Add the container to the array of shapes at the current level.
  shapesAtLevel.push(row);

  return shapesAtLevel;
}

function getHorizontallyOverlapping(shape, shapes){
  return shapes.filter(s => s.id !== shape.id && doesHorizontallyOverlap(s, shape));
}

function getNewRowDimensions(rowBuffer){
  log(`Getting row dimensions for row buffer`, rowBuffer.map(s => s.id));
  var allVertices = rowBuffer.map(shape => shape.meta.vertices).flat();
  var highestY = getHighestY(allVertices);
  var lowestY = getLowestY(allVertices);
  var highestX = getHighestX(allVertices);
  var lowestX = getLowestX(allVertices);
  log(`Highest Y:`, highestY, `Lowest Y:`, lowestY);
  var height = highestY - lowestY;
  var width = highestX - lowestX;

  return { height, width, midpoint: [(highestX + lowestX) / 2, (highestY + lowestY) / 2] };
}

// Given the lastId, shapes at a current level, and a parent, nests shapes within
// that level appropriately into rows.
// function implicitlyNestIntoRows(lastId, shapesAtLevel, parent){
//
//
//     if (!shapesAtLevel || shapesAtLevel.length === 0) return shapesAtLevel;
//
//     log(`Implicitly nesting into rows at level`, shapesAtLevel[0].level);
//
//     // var shapesByHeight = shapesAtLevel.sort((a, b) => a.meta.absoluteHeight < b.meta.absoluteHeight ? 1 : -1);
//
//     // log(`Sorted by height`, shapesByHeight);
//
//     // var tallestShape = shapesByHeight[0];
//
//     // log(`Tallest shape`, tallestShape);
//
//     // log(`Tallest shape (${tallestShape.meta.absoluteWidth}) is ${tallestShape.id}`);
//
//     // Iterate through all the shapes at the current nesting level, and examine
//     // adjacent shapes which may be placed at the same vertical level. Where this
//     // is the case, we nest both of them into a new container, and continue doing
//     // so for all other shapes at the same level which meet the same criteria.
//     shapesAtLevel.forEach(shape => {
//
//       log(`Shape count before nesting:`, shapesAtLevel.length);
//       shapesAtLevel = implicitlyNestHorizontallyWithRespectToShape(shape, shapesAtLevel, lastId, parent);
//       log(`Shape count after nesting:`, shapesAtLevel.length);
//
//     });
//
//     return shapesAtLevel;
//
// };
function implicitlyNestIntoRows(lastId, shapesAtLevel, parent){

  log(`Implicitly nesting`, shapesAtLevel.map(s => s.id));

  var rowBuffer = [];

  // Make a temporary copy of the number of shapes at the current level.s
  var shapes = shapesAtLevel.concat();

  // Iterate over all shapes with a for loop so that mutations of the array
  // will update the remaining number of iterations.
  for (var i = 0; i < shapes.length; i++){
    var shape = shapes[i];
    var overlappingShapes = getHorizontallyOverlapping(shape, shapes);

    log(`${shape.id} overlaps with`, overlappingShapes.map(s => s.id));

    log(`Shapes before filtering to remove overlapping shapes:`, shapes.map(s => s.id));
    // Remove overlappingShapes from the shapes array.
    shapes = shapes.filter(s => overlappingShapes.map(os => os.id).indexOf(s.id) === -1);
    log(`Shapes after filtering to remove overlapping shapes:`, shapes.map(s => s.id));


    for (var j = 0; j < overlappingShapes.length; j++){
      var overlappingShape = overlappingShapes[j];
      var extraOverlapping = getHorizontallyOverlapping(overlappingShape, shapes);
      overlappingShapes = overlappingShapes.concat(extraOverlapping);
      shapes = shapes.filter(s => overlappingShapes.map(os => os.id).indexOf(s.id) === -1);
    }

    rowBuffer = overlappingShapes;
    if (shapeArraysEqual(rowBuffer, parent.contains) || rowBuffer.length == 0) {
      // Revert the shapes array so that we don't lose any shapes that would have
      // otherwise been nested into a new row.
      log(`PRospective row:`, rowBuffer.map(s => s.id), `is empty or the same as parent contains array`, parent.contains.map(s => s.id));
      shapes = shapesAtLevel;
      continue;
    }
    else {
      var { height, width, midpoint } = getNewRowDimensions(rowBuffer);
      log(`Creating new row of height ${height} and width ${width}.`);
      var row = new Row({
        id: ++lastId,
        midpoint: midpoint,
        height: height,
        width: width,
        level: parent.level + 1,
        parent: parent
      });

      // Add the current shape to the row buffer.
      // rowBuffer.push(shape);
      // shapes = shapes.filter(s => s.id !== shape.id);

      // Add all shapes from the rowBuffer to the row.
      while (rowBuffer.length > 0)
        row.addContainingShape(rowBuffer.shift());

      log(`Added rowBuffer shapes to prospective row:`,row.contains.map(s => s.id));

      // Add the row to the shapes array.
      shapes.push(row);

      log(`Added the new row to the shapes array:`, shapes.map(s => Object({type: s.type, id: s.id})));

      // Update the parent's contains array.
      shapesAtLevel = shapes;
      parent.contains = shapes;

      log(`Updated the parent.contains array:`, parent.contains.map(s => s.id));
    }

  }

  return shapesAtLevel;
}

// Recursively nests all shapes within implicit rows and containers.
function nest(shapes){

  if (!shapes || shapes.length === 0) return shapes;

  shapes.forEach(shape => {

    // Recursively nest all containing shapes.
    shape.contains = nest(shape.contains);

    shape.contains = implicitlyNestIntoRows(getLastACRObjectId(shapes), shape.contains, shape);

    shape.contains = sortshapesAlongYAxis(shape.contains);

  });

  return shapes;
}

// Module entry point.
module.exports = {
  implicitlyNestIntoRows,
  implicitlyNestIntoVerticalContainers,
  nest
};

// Logging.
function log(...msg){
  // if (process.env.DEBUG) console.log(`IMPLICIT NEST |`, ...msg);
}
