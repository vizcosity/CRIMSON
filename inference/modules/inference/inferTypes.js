/**
 * Infers type based off of shape metadata and context.
 *
 *  @ Aaron Baw 2018
 */

// Dependencies.
const config = require('../../config/config.json');
const isSubtypeOf = require('../subtypes.js');
const { getLowestY, getHighestY } = require('../geometry.js');

// Default values.
const _FRAG_THRESH = config.thresholds.fragmentArea;

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

  // if (upperMostContainer) log(shape.id, upperMostContainer.id, upperMostContainer.meta.vertices[1][1]);

  return upperMostContainer && (shape.id == upperMostContainer.id);
}

// Footer specification:
// Lowermost element which is of type container or derived.
const isFooter = (shape, shapes) => {

  // Filter shapes so that we only deal with those at level 1.
  shapes = shapes.filter(s => s.level == 1);

  // log(`Checking footer with surrounding shapes`, shapes.length);

  // If no shapes passed we can assume that this is the global window or empty,
  // in which case we should return.
  if (shapes.length == 0) return false;

  // If footer has already been assigned then we return.
  if (shapes.filter(s => s.type == "footer").length > 0) return;

  // Find lowermost container.
  var lowerMostContainer = shapes.filter(s => isContainer(s)).sort((a, b) => a.meta.vertices[1][1] > b.meta.vertices[1][1]).reverse()[0];

  return lowerMostContainer && (shape.id == lowerMostContainer.id);
}

// Text header specification:
// Must contain a single centered horizontal line which takes up at least 33% of the
// width of the parent container.
const isHeader = shape => {

  // log(`Centered lines: `, shape.contains.filter(s => s.type == "centered_line"));
  //
  // if (shape.id == "4") log(shape.contains.filter(s => (s.type == "centered_line") && (parseFloat(s.meta.relativeWidth) >= 33)));
  // if (shape.id == "4"){
  //   // var centered_lines = shape.contains.filter(s => s.type == "centered_line");
  //   // centered_lines.forEach(line => log(parseFloat(line.meta.relativeWidth)));
  //   // log(line);
  // }

  return shape.contains.filter(s => s.type == "centered_line" && parseFloat(s.meta.relativeWidth) >= 33).length == 1;

}

// Paragraph component specification:
// Must contain more than a single contained horizontal line which takes up
// at least 33% of the width of the parent container.
const isParagraph = shape => {

  return shape.contains.filter(s => s.type == "horizontal_line" && parseFloat(s.relativeWidth) >= 33).length >= 2;

}

// Image specification:
// Container containing four triangles at all orientations. (tip facing inwards
// on every triangle).
const isImage = shape => {

  if (shape.type != "container" && shape.type != "row") return false;

  // if (shape.contains.filter(s => s.type == 'triangle').length !== 4) return false;

  // shape.contains.forEach(triangle => {
  //
  // });

  // Examine to see if the container contains any centered intersections.
  // log(`Checking if ${shape.id}(${shape.type}) is an image.`);
  if (shape.contains.filter(s => s.type === 'centered_intersection').length == 0) return false;

  // Lower level containers may be mistakenly classified as images, since they
  // are most likely to contain intersections, despite also containing
  // a variety of other drawable shapes. Here, we examine how many drawable
  // shapes are contained, and if there do not appear to be more than 3, then
  // we classify the container as an image. We can also make use of the fact that
  // images are likely to contain triangles & other polygons at the immediately
  // succeeding nest level.
  var containedDrawableShapes = shape.contains.filter(s => config.filter.indexOf(s.type) === -1);
  log(`Candidate image ${shape.id} contains ${containedDrawableShapes.length} drawable shapes.`);

  if (containedDrawableShapes.length > 2){
    log(containedDrawableShapes);
    // Check if any polygons or triangles have been detected, as this is typically
    // a good sign that the primitive is an image.
    if (containedDrawableShapes.filter(s => s.type == "triangle" || s.type == "polygon").length == 0)
      return false
  }

  return true;

};

const inferText = shapes => {

  // console.log('inferring text on', shapes.length);
  shapes.forEach(shape => {
    if (isHeader(shape)) shape.type = "header";
    if (isParagraph(shape)) shape.type = "paragraph";

    // log(`Inferring if text: `, shape);
  });

  return shapes;
};

const inferImages = shapes => {
  shapes.forEach(shape => {

    if (isImage(shape)) {
      shape.type = "image";
      // Clear contained shapes.
      shape.contains = [];
    }



  });
  return shapes;
}

const isRow = shape => {

  // A row is a special case of a container, so shape must first be identified
  // as a container before specialising.
  // log(`${shape.id} is type ${shape.type} at row inference point.`)
  if (shape.type != "container") return false;

  // For each shape contained, ensure that there is no vertical gaps between the current
  // shape and all other shapes.
  for (var i = 0; i < shape.contains.length; i++){
    for (var j = 0; j < shape.contains.length; j++){
      if (i == j) continue;

      if (shape.id == 13){
      // log(`${shape.contains[i].id}`,getHighestY(shape.contains[i]), `${shape.contains[i].id}`,getLowestY(shape.contains[i]));
      // log(`${shape.contains[j].id}`,getHighestY(shape.contains[j]), `${shape.contains[j].id}`,getLowestY(shape.contains[i]));


      log(shape.contains[i].id, getHighestY(shape.contains[i]), shape.contains[j].id, getLowestY(shape.contains[j]));
      log(shape.contains[i].id, getLowestY(shape.contains[i]), shape.contains[j].id, getHighestY(shape.contains[j]));}

      // The highestY of the shape should not be below the lowestY of the other shape.
      if (getHighestY(shape.contains[i]) < getLowestY(shape.contains[j])) return false;

      // The lowestY of the shape should not be above the highest Y of the other shape.
      if (getLowestY(shape.contains[i]) > getHighestY(shape.contains[j])) return false;
    }

  }

  return true;

};

// Helper function to calculate the distance from left/uppemost parent boundary
// in terms of percentage of parent size.
const relativeDistance = (parent, child, axis=0) => {
  var midpoint = parent.meta.midpoint[axis];

  var start = midpoint - (parent.meta.absoluteWidth / 2);

  var dist = child.meta.midpoint[axis] - start;

  // log(child.id, ` has dist of `, dist);

  return dist / parent.meta.absoluteWidth;
}

// Given a shape, determines if there is a fragment (defined as any polygon of
// size around 1% of parent) between the percentiles chosen. This denotes
// the boundaries in terms of the parent's width. E.g. a button would have a fragment
// contained within the 0.4-0.6 percentile region.
const getInnerFragmentsBetweenPercentiles = (shape, {start, end}, axis=0) => {

  // Filter by relative area.
  var fragments = shape.contains.filter(s => {

    // Skip if the prospective fragment is a point.
    if (s.meta.vertices.length == 1) return false;

    var areaRatio = (s.meta.area / shape.meta.area);
    // log(`Area ration of`, areaRatio, `between`, shape.id, `and`, s.id);
    return areaRatio <= _FRAG_THRESH;
  });
  // log(`Found ${fragments.length} fragments.`);

  // Filter by the position according to the percentiles given.
  fragments = fragments.filter(s => {
    var relDist = relativeDistance(shape, s);
    // log(`RelDist of `, relDist);
    return relDist < end && relDist > start;
  });

  // log(fragments.length, `fragments detected.`);

  return fragments;

}

const isDropdown = shape => {
  return getInnerFragmentsBetweenPercentiles(shape, {start: 0.8, end: 1}).length == 1;
}

const isButton = shape => {
  return getInnerFragmentsBetweenPercentiles(shape, {start: 0.4, end: 0.6}).length == 1;
}

const isTextInput = shape => {
  return getInnerFragmentsBetweenPercentiles(shape, {start: 0, end: 0.2}).length == 1;
}

const inferPanels = shapes => {
  // All highest level containers should be panels.
  // During primitive detection, we nest all shapes within our top level
  // containers, or 'windows'. These essentially form panels that will serve to
  // represent content 'pages' (keeping in mind that the entire page is still
  // a signle page static site).
  shapes.filter(s => s.level == 0).forEach(shape => {
    shape.type = "panel";
  });
  return shapes;
}

const inferRows = shapes => {
  shapes.forEach(shape => {
    shape.type = isRow(shape) ? 'row' : shape.type
  });
  return shapes;
}

const inferFromMap = shapes => {
  shapes.forEach(shape => {
    // log(shape.type, config.shapeMap[shape.type]);
    shape.type = config.shapeMap[shape.type] ? config.shapeMap[shape.type] : shape.type;
  });
  return shapes;
}

const inferNavigation = shapes => {

  // Ensure we are working at the top level, with panels.
  if (shapes.filter(s => s.type == "panel").length == 0) return shapes;

  // Infer navigation on the children of the first panel.
  shapes[0].contains.forEach(shape => {
    if (isNavigation(shape, shapes[0].contains)) shape.type = "navigation";
  });
  return shapes;
}

const inferFooter = shapes => {

  // Ensure we are working at the top level, with panels.
  if (shapes.filter(s => s.type == "panel").length == 0) return shapes;

  // log(`Inferring footer with shapes`, shapes.map(s => s.id));

  // Infer footer on the children of the last panel.
  shapes[shapes.length - 1].contains.forEach(shape => {
    if (isFooter(shape, shapes[shapes.length - 1].contains)) shape.type = "footer";
  });
  return shapes;
}

const inferInteractiveContainers = shapes => {
  shapes.forEach(shape => {

    // if (shape.id == 13) log(shape.contains)

    // Interactive container detection depends on the presence of fragments
    // within the container, placed at a certain position. If the shape contains
    // more than a single child element, then we skip the shape as it is likely
    // a container containing other shape elements that happen to be fairly small.
    if (shape.contains.length > 1) return false;

    // An interactive container must first be a container, or a derived type
    // thereof. Navigation bars and footers, for example, will likely contain
    // links (<a> tags) which may be misclassified as fragments.
    if (shape.type !== "container" || shape.type !== "row") return false;

    if (isDropdown(shape, shapes))  shape.type = "dropdown";
    if (isButton(shape, shapes)) shape.type = "button";
    if (isTextInput(shape, shapes)) shape.type = "textInput";

  });
  return shapes;
}

// TODO: Refactor this to use a promise - based workflow.
module.exports = (shapes) => {

  log(`Inferring from`, shapes.length, `shapes.`);

  // Detect presence of *panels*, which are full-height containers / pages.
  shapes = inferPanels(shapes);

  // Appropriate rows and containers must first be inferred.
  shapes = inferFromMap(shapes);
  shapes = inferRows(shapes);

  // Infer navigation on the topmost panel only.
  shapes = inferNavigation(shapes);

  // Infer footer on the last panel only.
  shapes = inferFooter(shapes);

  shapes = inferImages(shapes);

  shapes = inferInteractiveContainers(shapes);

  shapes = inferText(shapes);

  return shapes;
}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`INFER TYPE |`, ...msg);
}
