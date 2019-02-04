/**
 * Module for processing detected JSON shapes into HTML code.
 *
 * @ Aaron Baw 2018
 */

// Dependencies.
const shapeMap = require('../config/config.json').shapeMap;
const { implicitlyNestIntoVerticalContainers, implicitlyNestIntoRows, nest } = require('./inference/implicitNest');
const { getLastACRObjectId, sortshapesAlongYAxis, sortShapes } = require('./geometry');
const inferProperties = require('./inference/infer');
const indent = require('indent-string');
const transform = require('./transformation/transform');
const fs = require('fs');

function log(...msg){
  if (process.env.DEBUG) console.log(`GEN CODE |`, ...msg);
}

// Separates shapes into navigation and remaining shapes.
function separateNavFromShapes(shapes){

  if (!shapes || shapes.length === 0) return {navShapes: [], remainingShapes: shapes};

  var navShapes = [];
  var remainingShapes = shapes.concat();
  shapes.forEach(shape => {
    var separateContainedShapes = separateNavFromShapes(shape.contains);
    shape.contains = separateContainedShapes.remainingShapes;
    var updatedNavShapes = separateContainedShapes.navShapes;
    if (updatedNavShapes.length > 0) navShapes = navShapes.concat(updatedNavShapes);
    if (shape.type === 'navigation') {
      navShapes.push(shape);
      remainingShapes = remainingShapes.filter(s => s.id !== shape.id);
    }
  });
  // console.log(remainingShapes);

  return {navShapes, remainingShapes};

}

 // Given a transformed preNode, embeds this into serialised HTML.
 function embedCode(preNode){

   // If preNode is a string, then inject this code directly.
   if (typeof preNode == 'string') return preNode;

   var serialisedAttributes = "";

   for (var attribute in preNode.attributes){
     serialisedAttributes += ` ${attribute}="${preNode.attributes[attribute]}"`
   }

   var nodeType = preNode.elementType ? preNode.elementType : 'div';
   var openTag = typeof nodeType === 'object' ? nodeType.open : `<${nodeType} ${serialisedAttributes}>`;
   var closeTag = typeof nodeType === 'object' ? nodeType.close : `</${nodeType}>`;

   var content = "";
   if (typeof preNode.content == 'object'){
    if (!Array.isArray(preNode.content)) preNode.content = [preNode.content];
      preNode.content.forEach(node => content += indent(`\n${embedCode(node)}`, 8));
    } else content = preNode.content;

   // If no content we assume a self-closed tag.
   return preNode.content ? `
    ${openTag}${content}
    ${closeTag}
    ` :
    `<${nodeType}${serialisedAttributes} />`;

 }

 // Generate code for a single shape element.
 async function generateShapeCode(container, containingCode){

   if (!container) return "";

   // Transform agnostic component representation into specific HTML properties
   // and directives within context of selected component framework or environment
   // (e.g.) Bootstrap or ReactJS.

   // Saved as a HTML 'preNode' object; i.e., it is ready to be injected as a
   // DOM Node. This is a JSON representation of the DOM object, comprised of a
   // dictionary of key value pairs, where keys are property names of the HTML
   // node.
   var preNode = await transform(container).then();

   if (!container.class) container.class = container.type;

   return embedCode(preNode);

 }

 // We have a separate method which first performs some pre-processing on
 // the shape primitives returned by the detection pipeline. We then pass these
 // onto the recursive generateACRObjects method.
 function generateACR(shapes){

   if (!shapes || shapes.length == 0) return shapes;

   // Implicitly nest shapes horizontally and vertically.
   shapes = nest(shapes);

   // Generate ACR for the objects after performing the implicit nesting.
   return generateACRObjects(shapes);
 }

 function generateACRObjects(shapes){

   if (!shapes || shapes.length == 0) return shapes;

   for (var i = 0; i < shapes.length; i++){
     // log(`About to gen code for `, shapes[i]);
     shapes[i].contains = generateACRObjects(shapes[i].contains);
   }

   return inferProperties(shapes);
 }

 // Takes JSON representation of detected shapes and outputs serialised HTML for the
 // given shapes.s
 async function generate(shapes){
   if (!shapes || shapes.length == 0) return "";

   var output = "";

   for (var i = 0; i < shapes.length; i++){
     var shape = shapes[i];
     // log(`Transforming`, shape.type);

     var containedCode = await generate(shape.contains);

     output += await generateShapeCode(shape, containedCode);

   }

   return output;
 }

// Takes JSON representation of detected shapes and outputs serialised HTML,
// ensuring to keep any navigation as separated markup for auth generation.
async function generateCode(shapes){

  // Separate out navigation if it exists.
  var separated = separateNavFromShapes(shapes);

  return {
    nav: await generate(separated.navShapes),
    index: await generate(separated.remainingShapes)
  }
}

// Configure module.
module.exports = {generateCode, generateACR};
