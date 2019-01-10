/**
 * Inspects child containers of some row container, and determines the appropriate
 * grid spaces to conform each container to along the horizontal axis, according
 * to the Bootstrap 12-column grid system. [https://getbootstrap.com/docs/4.0/layout/grid/]
 *
 * @ Aaron Baw 2018
 */

const { sortShapesAlongXAxis } = require('../geometry.js');

const config = require('../../config/config.json');

 // Assumes that there is a maximum of one container along the vertical axis.
const determineNumOfGridCells = (shape, budget) => {
  var width = parseFloat(shape.meta.relativeWidth) / 100;
  var numCells = width / (1 / budget);
  log(numCells, shape.meta.relativeWidth);
  return {
    numCells: Math.floor(numCells),
    clipSize: numCells - Math.floor(numCells)
  };
}
// // Use inferred grid properties to determine class.
// const serialiseClasses = shapes => {
//
//   var output = [];
//
//   shapes.forEach(shape => {
//     if (shape.gridCell && shape.gridCell.count)
//       shape.class = `col-${shape.gridCell.count}`;
//     output.push(shape);
//   });
//
//   // console.log(shapes);
//
//   return shapes;
//
// }


module.exports = (row) => {


  // Return if row is not a container.
  if (row.type != "row") {
    return row;
  }


  // Return if no contained shapes or just a single shape.
  if (row.contains.length <= 1) return row;

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
    var {id} = row.contains.concat().sort((a, b) => a.gridCell.clipSize < b.gridCell.clipSize)[0];
    var mostClipped = row.contains.filter(shape => shape.id == id)[0];

    // Assign a new cell.
    mostClipped.gridCell.count++;

    // Update clipping.
    mostClipped.gridCell.clipSize -= 1;

    // Update budget.
    cellBudget--;
  };

  // Assign type of row to parent.
  row.type = "row";

  // Assign appropriate class based off of grid properties.
  // row.contains = serialiseClasses(row.contains);

  // Return row.
  return row;
};

// Utility functions.
function log(...msg){
  if (process.env.DEBUG) console.log(`INFER GRID | `, ...msg);
}
