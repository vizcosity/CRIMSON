/**
 * Infers type based off of shape metadata and context.
 *
 *  @ Aaron Baw 2018
 */
const config = require('../../config/config.json');

const getHighestY = shape => {
  return shape.meta.vertices.sort((a, b) => a[1] < b[1])[0]
};

const getLowestY = shape => {
  return shape.meta.vertices.sort((a, b) => a[1] > b[1])[0];
};

const isContainer = shape => {
  return shape.type == "row" || shape.type == "container";
};

// Navigation specification:
// Uppermost element which is of type container or derived.
const isNavigation = (shape, shapes) => {

  // Filter shapes so that we only deal with those at level 1.
  shapes = shapes.filter(s => s.level == 1);

  // If navigation has already been assigned then we return.
  if (shapes.filter(s => s.type == "navigation").length > 0) return;

  // If no shapes passed we can assume that this is the global window.
  if (shapes.length == 0) return false;

  // Find uppermost container.
  var upperMostContainer = shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] > b.meta.vertices[1][1])[0];

  // log(shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] < b.meta.vertices[1][1]).map(s => s.meta.vertices[1][1]))

  log(shape.id, upperMostContainer.id, upperMostContainer.meta.vertices[1][1]);

  return upperMostContainer && (shape.id == upperMostContainer.id);
}

// Footer specification:
// Lowermost element which is of type container or derived.
const isFooter = (shape, shapes) => {

  // Filter shapes so that we only deal with those at level 1.
  shapes = shapes.filter(s => s.level == 1);

  // If no shapes passed we can assume that this is the global window or empty,
  // in which case we should return.
  if (shapes.length == 0) return false;

  // If footer has already been assigned then we return.
  if (shapes.filter(s => s.type == "footer").length > 0) return;

  // Find lowermost container.
  var lowerMostContainer = shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] > b.meta.vertices[1][1]).reverse()[0];

  return lowerMostContainer && (shape.id == lowerMostContainer.id);
}

// Image specification:
// Container containing four triangles at all orientations. (tip facing inwards
// on every triangle).
const isImage = shape => {

  if (shape.type != "container") return false;
  if (shape.contains.filter(s => s.type == 'triangle').length !== 4) return false;

  shape.contains.forEach(triangle => {

  });

  return true;

};

const inferImages = shapes => {
  shapes.forEach(shape => {
    if (isImage(shape)) shape.type = "image";

    // Clear contained triangles.
    shape.contains = shape.contains.filter(s => s.type != "triangle");

  });
  return shapes;
}

const isRow = shape => {

  // A row is a special case of a container, so shape must first be identified
  // as a container before specialising.
  if (shape.type != "container") return false;

  // For each shape contained, ensure that there is no vertical gaps between the current
  // shape and all other shapes.
  for (var i = 0; i < shape.contains.length; i++){
    for (var j = 0; j < shape.contains.length; j++){
      if (i == j) continue;
      // log(`${shape.contains[i].id}`,getHighestY(shape.contains[i]), `${shape.contains[i].id}`,getLowestY(shape.contains[i]));
      // log(getLowestY(shape.contains[j]), getHighestY(shape.contains[j]));



      // The highestY of the shape should not be below the lowestY of the other shape.
      if (getHighestY(shape.contains[i]) < getLowestY(shape.contains[j])) return false;

      // The lowestY of the shape should not be above the highest Y of the other shape.
      if (getLowestY(shape.contains[i]) > getHighestY(shape.contains[j])) return false;
    }

  }

  return true;

};


// TODO: Will have to be updated when handwritten text recognition is implemented,
// as it will also include the presence of text within the same container.
const isDropdown = shape => {

  // Check if there is a single triangle contained within the shape and that it is
  // located within the right half of the container.
  var containedTriangles = shape.contains.filter(s => s.type == "triangle");

  if (!containedTriangles || containedTriangles.length == 0) return false;

  if (containedTriangles.length > 0) log("WARN: Multiple triangles detected in isDropdown().");

  var triangle = containedTriangles[0];

  // Check that the triangle is within the right half of the container.
  var containerMidPointX = shape.meta.midpoint[0];
  if (triangle.meta.vertices.filter(vertex => vertex[0] > containerMidPointX).length != 0) return false;

  // Check that the triangle is about 10% of the area size of its container.
  if ((triangle.meta.area / shape.meta.area) > 0.1) return false;

  return true;

}

const isButton = shape => {
  return false;
}

const inferRows = shapes => {
  shapes.forEach(shape => {
    shape.type = isRow(shape) ? 'row' : shape.type
  });
  return shapes;
}

const inferFromMap = shapes => {
  shapes.forEach(shape => {
    shape.type = config.shapeMap[shape.type] ? config.shapeMap[shape.type] : shape.type;
  });
  return shapes;
}

const inferNavigation = shapes => {
  shapes.forEach(shape => {
    if (isNavigation(shape, shapes)) shape.type = "navigation";
  });
  return shapes;
}

const inferFooter = shapes => {
  shapes.forEach(shape => {
    if (isFooter(shape, shapes)) shape.type = "footer";
  });
  return shapes;
}

const inferButtonsAndDropdowns = shapes => {
  shapes.forEach(shape => {
    if (isDropdown(shape, shapes)) shape.type = "dropdown";
    if (isButton(shape, shapes)) shape.type = "button";
  });
  return shapes;
}

// TODO: Refactor this to use a promise - based workflow.
module.exports = (shapes) => {

  // console.log(shapes);

  // Appropriate rows and containers must first be inferred.
  shapes = inferFromMap(shapes);
  shapes = inferRows(shapes);

  // Check if this is the uppermost row of the 'level 1' container.
  shapes = inferNavigation(shapes);
  shapes = inferFooter(shapes);

  shapes = inferImages(shapes);

  shapes = inferButtonsAndDropdowns(shapes);

  return shapes;
}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`INFER TYPE |`, ...msg);
}
