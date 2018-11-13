/**
 * Module for processing detected JSON shapes into HTML code.
 *
 * @ Aaron Baw 2018
 */

 // Dependencies.
 const shapeMap = require('../config/config.json').shapeMap;
 const inferProperties = require('./inference/infer');
 const indent = require('indent-string');

 // Generate code for a single shape element.
 function generateShapeCode(container, containingCode){



   if (!container) return "";

   if (!container.class) container.class = container.type;

   return `
   <div style="height:${container.meta.relativeHeight};" class="${container.class}" data-id="${container.id}">

   <span class="label-wrap">
    <label style="align-self:flex-start;">${container.id}</label>
   </span>
      ${indent(containingCode, 8)}
   </div>`;

 }

 // Takes JSON representation of detected shapes and outputs serialised HTML.
 function generateCode(shapes){
   if (!shapes || shapes.length == 0) return "";

   // Collect properties for each shape.
   shapes = inferProperties(shapes);

   var output = "";

   shapes.forEach(shape => {

     output += generateShapeCode(shape, generateCode(shape.contains));
   });

   return output;
 }

// Configure module.
module.exports = generateCode;
