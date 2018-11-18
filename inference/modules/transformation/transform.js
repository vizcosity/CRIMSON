/**
 *  Transform agnostic representation of component hierarchy into a lower-level
 *  'preNode' representation, specific to the context being generated for.
 *
 *  Abstracts away the need to consider specific contexts such as a given
 *  component framework or library.
 *
 *  @ Aaron Baw 2018
 */

const typeMap = require('./typeToElementMap.json');

function BootstrapObject(shape){

  this.shape = shape;

  this.elementType = typeMap[shape.type] ? typeMap[shape.type] : 'div';

  this.attributes = {
    'class': resolveClass(shape),
    'style': shape.level != 0 ? `height:${shape.meta.relativeHeight}` : "",
    'data-id': shape.id,
    ...resolveCustomAttributes(shape)
  }

  // Add shape id.
  this.content = [{
    elementType: 'span',
    attributes: {
      'class': 'label-wrap'
    },
    content: {
      elementType: 'label',
      content: shape.id
    }
  }];

  shape.contains.forEach(shape => this.content.push(new BootstrapObject(shape)));

  function resolveClass(shape){

    if (shape.gridCell && shape.gridCell.count) return `col-${shape.gridCell.count}`;

    if (shape.type == "navigation"){
      return "navbar navbar-expand-lg navbar-light bg-light";
    }

    if (shape.type == "footer"){
      return "bd-footer";
    }

    if (shape.type == "image"){
      return "img-fluid";
    }

    return shape.type;

  }

  function resolveCustomAttributes(shape){
    if (shape.type == "image"){
      // Use template image for now.
      return {
        src: src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_167219acfd8%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_167219acfd8%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.09375%22%20y%3D%22104.6546875%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
      }
    }
  }

}

module.exports = function Transform (shape){
  return new Promise((resolve, reject) => {

    // Generate bootstrap object by default.
    return resolve(new BootstrapObject(shape));

  });
}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`TRANSFORM |`, ...msg);
}
