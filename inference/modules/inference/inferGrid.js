/**
 * Inspects child containers of some row container, and determines the appropriate
 * grid spaces to conform each container to along the horizontal axis, according
 * to the Bootstrap 12-column grid system. [https://getbootstrap.com/docs/4.0/layout/grid/]
 *
 * @ Aaron Baw 2018
 */

const { sortShapesAlongXAxis } = require('../geometry.js');
const { Container } = require("../ACR.js");
const config = require('../../config/config.json');

 // Assumes that there is a maximum of one container along the vertical axis.
const determineNumOfGridCells = (shape, budget) => {
  var width = parseFloat(shape.meta.relativeWidth) / 100;
  var numCells = width / (1 / budget);
  log(`Assigning ${Math.floor(numCells)} cells to ${shape.id} which has relative width:`, shape.meta.relativeWidth);
  return {
    numCells: Math.floor(numCells),
    clipSize: numCells - Math.floor(numCells)
  };
};

// When embedding images within some row, it is crucial that we nest images within
// a container in order to obey the column and spacing rules.
const nestImagesWithinContainers = (shapes, lastId) => {

  return {
    nestedImages: shapes.map(shape => {
      if (shape.type !== "image") return shape;

      // log(`Nesting image`, shape.id, shape.meta);

      lastId += 1;

      var container = new Container({
        id: lastId,
        parent: null,
        midpoint: shape.meta.midpoint,
        width: shape.meta.absoluteWidth,
        height: shape.meta.absoluteHeight,
        level: shape.level
      });

      // Replace the metadata for this container with that of the original image.
      container.meta = Object.assign({}, shape.meta);

      // Add the shape as a contained element of the container.
      container.addContainingShape(shape);

      return container;
    }),
    lastId: lastId
  }
}

const inferGridAtLevel = (row, lastId) => {

  // Return if row is not a container.
  if (row.type != "row") {
    return {row, lastId};
  }

  // Nest images within containers before assigning grid cells.
  var { nestedImages, lastId } = nestImagesWithinContainers(row.contains, lastId);

  row.contains = nestedImages;

  // Return if no contained shapes or just a single shape.
  if (row.contains.length <= 1) return {row, lastId};

  // Sort the contained shapes along x axis from left to right.
  row.contains = sortShapesAlongXAxis(row.contains);

  // TODO: Handle having more columns than permitted by the cell budget.

  var cellBudget = config.grid.cellBudget;
  var totalBudget = config.grid.cellBudget;
  // For each cell; determine the size of the cell and assign this to the shape.
  // Divide the relative width by reciprocal of cell budget and floor this.
  // Keep track of clipping amount and re-assign leftover cells from budget
  // to shapes in order of largest clipping amount.
  row.contains.forEach(shape => {
    if (cellBudget < 0) {
      log(`Cannot assign new cells, cell budget depleted.`);
      return false;
    }
    if (!shape.gridCell) shape.gridCell = {};
    var {numCells, clipSize} = determineNumOfGridCells(shape, totalBudget);
    shape.gridCell.count = numCells;
    shape.gridCell.clipSize = clipSize;
    cellBudget -= numCells;
  });


  // Assign leftover cells to shapes with largest clip amount.
  while (cellBudget > 0){
    var mostClipped = row.contains.concat().sort((a, b) => a.gridCell.clipSize < b.gridCell.clipSize ? 1 : -1)[0];
    // var mostClipped = row.contains.filter(shape => shape.id == id)[0];

    // log(`Most clipped shape is ${mostClipped.id} with gridcell object`,mostClipped.gridCell);

    // Assign a new cell.
    mostClipped.gridCell.count++;

    // Update clipping.
    mostClipped.gridCell.clipSize -= 1;

    // Update budget.
    cellBudget--;
  };

  // Assign appropriate class based off of grid properties.
  // row.contains = serialiseClasses(row.contains);

  // Return row.
  return {row, lastId};
};

const inferGrid = (shapes, lastShapeId) => {

  if (!shapes || shapes.length === 0) return shapes;

  shapes.forEach(shape => {
    shape.contains = inferGrid(shape.contains, lastShapeId);
    var { row, lastId } = inferGridAtLevel(shape, lastShapeId);
    lastShapeId = lastId;
    shape = row;
  });

  return shapes;
};

module.exports = {
  inferGrid,
  inferGridAtLevel
};

// Utility functions.
function log(...msg){
  if (process.env.DEBUG) console.log(`INFER GRID | `, ...msg);
}
