/**
 * Module for processing detected JSON shapes into HTML code.
 *
 * @ Aaron Baw 2018
 */

 // Generate code for a single shape element.
 function generateShapeCode(container, containingCode){

   return `
   <div class="${shapeMap[container.type]}" data-id="${container.id}">
     ${containingCode}
   </div>`;

 }

 // Takes JSON representation of detected shapes and outputs serialised HTML.
 function generateCode(shapes){
   if (!shapes) return "";

   var output = "";

   shapes.forEach(shape => {
     output += generateShapeCode(shape, generateShapeCode(shape.contained));
   });

   return output;
 }

// Configure module.
module.exports = generateCode;
