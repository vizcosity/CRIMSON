/**
 * Module for processing detected JSON shapes into HTML code.
 *
 * @ Aaron Baw 2018
 */

 // Dependencies.
 const shapeMap = require('../config/config.json').shapeMap;
 const inferProperties = require('./inference/infer');
 const indent = require('indent-string');
 const transform = require('./transformation/transform');

 // Given a transformed preNode, embeds this into serialised HTML.
 function embedCode(preNode){

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

   return `
    <${nodeType}${serialisedAttributes}>${content}
    </${nodeType}>
    `;

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

   // return `
   // <div style="height:${container.meta.relativeHeight};" class="${container.class}" data-id="${container.id}">
   //
   // <span class="label-wrap">
   //  <label style="align-self:flex-start;">${container.id}</label>
   // </span>
   //    ${indent(containingCode, 8)}
   // </div>`;

 }

 // Takes JSON representation of detected shapes and outputs serialised HTML.
 async function generateCode(shapes){
   if (!shapes || shapes.length == 0) return "";

   // Collect properties for each shape.
   shapes = inferProperties(shapes);

   var output = "";

   for (var i = 0; i < shapes.length; i++){
     var shape = shapes[i];

     var containedCode = await generateCode(shape.contains);

     output += await generateShapeCode(shape, containedCode);

   }

   return output;
 }

// Configure module.
module.exports = generateCode;
