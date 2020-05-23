/**
 * Compound primitive inference module.
 *
 * Given a list of atomic primitives, such as images, inputs, headers, etc.
 * This module aims to 'group' these together into higher level components where
 * appropriate, such as in the case of inferring cards, jumbotrons, and media
 * objects.
 *
 * @ Aaron Baw 2019
 */

const isSubtypeOf = require('../subtypes.js');

// The compoundPrimitiveMap defines the mapping between the serialised representaiton
// of the primitives in the designed DSL language, into the higher order primitive
// types.
const compoundPrimitiveMap = require("../../config/compoundPrimitiveMap");

// const serialise = (shape, prev) => {
//
//
//
// };

const serialise = shape => {

  if (shape.type == "row"){
    var innerShapes = shape.contains.map(s => serialise(s)).reverse().reduce((curr, prev, i) => prev + (i !== 0 ? ", " : "") + curr, "");
    return `row { ${innerShapes} }`;
  };

  if (shape.type == "container"){
    var innerShapes = shape.contains.map(s => serialise(s)).reverse().reduce((curr, prev, i) => prev + (i !== 0 ? "; " : "") + curr, "");
    return `container { ${innerShapes} }`;
  }

  return shape.type;

};

function inferCompoundPrimitivesAtLevel(shapes){

  // console.log(`Inferring compound primitives on`, shapes.map(s => s.id));

  // Compound primitives will start out as being containers, or rows.
  shapes.filter(s => s.type == "container" || s.type == "row").forEach(shape => {

    // We convert each shape into a serialised representation. By transforming
    // each shape into an object within our DSL, we can easily define new shapes
    // and compound primitives without having to manually encode all the required
    // rules and constraints. This also opens up the possibility that users may
    // add their own compound primitives without the need for added codes.
    var serialised = serialise(shape);
    // console.log(`Created serialised represnetation for shape:`, serialised);

    if (compoundPrimitiveMap[serialised]) {
      shape.type = compoundPrimitiveMap[serialised];
      log(`${shape.id} (${serialised}) is a compound primitive:`, compoundPrimitiveMap[serialised]);
    }


  });

  return shapes;
}

function inferCompoundPrimitives(shapes){

  if (!shapes || shapes.length === 0) return shapes;

  shapes.forEach(shape => {
    shape.contains = inferCompoundPrimitives(shape.contains);
    shape.contains = inferCompoundPrimitivesAtLevel(shape.contains);
  });

  return shapes;

}

module.exports = {
  inferCompoundPrimitivesAtLevel: inferCompoundPrimitivesAtLevel,
  inferCompoundPrimitives: inferCompoundPrimitives,
  serialise
}

function log(...msg){
  // if (process.env.DEBUG) console.log(`INFER COMPOUND |`, ...msg);
}
