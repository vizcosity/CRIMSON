/**
 * Inference pipeline for assigning properties about shapes for code generation.
 *
 *  @ Aaron Baw 2018
 */

const inferGrid = require('./inferGrid');
const { implicitlyNestIntoVerticalContainers, implicitlyNestIntoRows } = require('./implicitNest');
const { getLastACRObjectId } = require('../geometry');
const inferTypes = require('./inferTypes');

// Infer properties about the shapes which will then be generated into HTML code.
module.exports = function inferProperties(shapes){

  console.log(`ACR:`, shapes);

  // Nest into rows and vertical containers.
  shapes.forEach(prospectivePanel => {

    // console.log(`Panel`, prospectivePanel.id);
    // Our specification declares that the top level of each panel should solely
    // be comprised of vertically composited rows. As such, we need to nest
    // our objects within containers along the vertical axis, and then horizontally
    // in rows.

    var lastId = getLastACRObjectId(shapes);
    console.log(`Last ID`, lastId);
    console.log(`Current Panel`, prospectivePanel.id);
    console.log(prospectivePanel.contains);

    // prospectivePanel.contains = implicitlyNestIntoVerticalContainers(getLastACRObjectId(shapes), prospectivePanel.contains, prospectivePanel);
    // prospectivePanel.contains = implicitlyNestIntoRows(lastId, prospectivePanel.contains, prospectivePanel);

  });

  // Infer types.
  shapes = inferTypes(shapes);

  console.log(`ACR After inferring types:`, shapes);

  // Infer grid information for containers representing rows.
  shapes.forEach(shape => {

    // console.log(`Inferring grid.`);

    // Infer grids.
    shape = inferGrid(shape);

  });

  return shapes;
}
