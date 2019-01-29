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
  if (process.env.debug) console.log(`GEN CODE |`, ...msg);
}

 // Given a transformed preNode, embeds this into serialised HTML.
 function embedCode(preNode){

   // If preNode is a string, then inject this code directly.
   if (typeof preNode == 'string') return preNode;

   var nodeType = preNode.elementType ? preNode.elementType : 'div';

   var serialisedAttributes = "";

   for (var attribute in preNode.attributes){
     serialisedAttributes += ` ${attribute}="${preNode.attributes[attribute]}"`
   }

   var content = "";
   if (typeof preNode.content == 'object'){
    if (!Array.isArray(preNode.content)) preNode.content = [preNode.content];
      preNode.content.forEach(node => content += indent(`\n${embedCode(node)}`, 8));
    } else content = preNode.content;

   // If no content we assume a self-closed tag.
   return preNode.content ? `
    <${nodeType}${serialisedAttributes}>${content}
    </${nodeType}>
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

   // console.log(`GENERATE CODE | Generating ACR Objects`);

   if (!shapes || shapes.length == 0) return shapes;

   for (var i = 0; i < shapes.length; i++){
     // log(`About to gen code for `, shapes[i]);
     shapes[i].contains = generateACRObjects(shapes[i].contains);
   }

   return inferProperties(shapes);
 }

 // Takes JSON representation of detected shapes and outputs serialised HTML.
 async function generateCode(shapes){
   if (!shapes || shapes.length == 0) return "";

   // Generate ACR.
   // shapes = inferProperties(shapes);

   var output = "";

   for (var i = 0; i < shapes.length; i++){
     var shape = shapes[i];

     var containedCode = await generateCode(shape.contains);

     output += await generateShapeCode(shape, containedCode);

   }

   return output;
 }

// Configure module.
module.exports = {generateCode, generateACR};
