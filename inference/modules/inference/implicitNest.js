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

const { getHighestX, getLowestX, getHighestY, getLowestY, doesHorizontallyOverlap, doesVerticallyOverlap, getLastACRObjectId } = require('../geometry.js');
const { Container, Row } = require('../ACR.js');
const { padding } = require('../../config/config.json');

// Given the lastId, shapes at current level, and a parent object, nests all
// of the objects within a container which share a vertically overalpping portion
// with the widest shape.
function implicitlyNestIntoVerticalContainers(lastId, shapesAtLevel, parent){

  if (!shapesAtLevel || shapesAtLevel.length === 0) return shapesAtLevel;

  // log(`Implicitly nesting into vertical containers at level`, shapesAtLevel[0].level);

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
  // Remove widestShape from current shape level.
  shapesAtLevel = shapesAtLevel.filter(s => s.id !== widestShape.id);

  // Nest all shapes which share a vertical overlapping with the widest shape.
  shapesAtLevel.forEach(shape => {
    if (doesVerticallyOverlap(widestShape, shape)){
      containerBuffer.push(shape);
      shapesAtLevel = shapesAtLevel.filter(s => s.id !== shape.id);
    }

  });

  // log(`Container Buffer:`, containerBuffer);

  // Find the height and width of the container.
  var allVertices = containerBuffer.map(shape => shape.meta.vertices).flat();

  // log(`All Vertices in buffer:`, allVertices);

  var containerHeight = getHighestY(allVertices) - getLowestY(allVertices) + padding;
  var containerWidth = getHighestX(allVertices) - getLowestX(allVertices) + padding;

  // // Create the container object.
  var container = new Container({
    id: ++lastId,
    midpoint: parent.meta.midpoint,
    height: containerHeight,
    width: containerWidth,
    parent: parent
  });

  // Add container buffer shapes to container.
  containerBuffer.forEach(shape => container.addContainingShape(shape));

  // Add the container to the array of shapes at the current level.
  shapesAtLevel.push(container);

  return shapesAtLevel;
}

// Given the lastId, shapes at a current level, and a parent, nests shapes within
// that level appropriately into rows.
function implicitlyNestIntoRows(lastId, shapesAtLevel, parent){


    if (!shapesAtLevel || shapesAtLevel.length === 0) return shapesAtLevel;

    log(`Implicitly nesting into rows at level`, shapesAtLevel[0].level);

    var shapesByHeight = shapesAtLevel.sort((a, b) => a.meta.absoluteHeight < b.meta.absoluteHeight ? 1 : -1);

    // log(`Sorted by height`, shapesByHeight);

    var tallestShape = shapesByHeight[0];

    // log(`Tallest shape`, tallestShape);

    // log(`Tallest shape (${tallestShape.meta.absoluteWidth}) is ${tallestShape.id}`);

    // Create a buffer which will store all the shapes we will be adding to the
    // container. We need to do this because we can't create the container until
    // we know how tall and wide it needs to be.
    var rowBuffer = [];

    rowBuffer.push(tallestShape);
    // Remove widestShape from current shape level.
    shapesAtLevel = shapesAtLevel.filter(s => s.id !== tallestShape.id);

    // Nest all shapes which share a vertical overlapping with the widest shape.
    shapesAtLevel.forEach(shape => {
      if (doesHorizontallyOverlap(tallestShape, shape)){
        rowBuffer.push(shape);
        shapesAtLevel = shapesAtLevel.filter(s => s.id !== shape.id);
      }

    });

    // log(`Container Buffer:`, containerBuffer);

    // Find the height and width of the container.
    var allVertices = rowBuffer.map(shape => shape.meta.vertices).flat();

    // log(`All Vertices in buffer:`, allVertices);

    var rowHeight = getHighestY(allVertices) - getLowestY(allVertices) + padding;
    var rowWidth = getHighestX(allVertices) - getLowestX(allVertices) + padding;

    // // Create the container object.
    var row = new Row({
      id: ++lastId,
      midpoint: parent.meta.midpoint,
      height: rowHeight,
      width: rowWidth,
      parent: parent
    });

    // Add container buffer shapes to container.
    rowBuffer.forEach(shape => row.addContainingShape(shape));

    // Add the container to the array of shapes at the current level.
    shapesAtLevel.push(row);

    return shapesAtLevel;

}

// Module entry point.
module.exports = {
  implicitlyNestIntoRows,
  implicitlyNestIntoVerticalContainers
};

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(`IMPLICIT NEST |`, ...msg);
}
