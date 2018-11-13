/**
 *  Transform agnostic representation of component hierarchy into a lower-level
 *  'preNode' representation, specific to the context being generated for.
 *
 *  Abstracts away the need to consider specific contexts such as a given
 *  component framework or library.
 *
 *  @ Aaron Baw 2018
 */

function BootstrapObject(shape){

  this.shape = shape;

  this.attributes = {
    'class': shape.gridCell && shape.gridCell.count ? `col-${shape.gridCell.count}` : shape.type,
    'style': `height:${shape.meta.relativeHeight}`,
    'data-id': shape.id
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
