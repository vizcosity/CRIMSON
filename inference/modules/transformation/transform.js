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

  // log("Transforming shape of type", shape.type);

  this.shape = shape;

  this.elementType = typeMap[shape.type] ? typeMap[shape.type] : 'div';

  this.attributes = {
    'class': resolveClass(shape),
    // 'style': shape.level != 0 ? `height:${shape.meta.relativeHeight}` : "",
    'data-id': shape.id,
    ...resolveCustomAttributes(shape)
  }

  // Add shape id.
  this.content = resolveCustomContent(shape);

  function resolveClass(shape){

    var classes = "";

    if (shape.gridCell && shape.gridCell.count) classes +=  `column container col-${shape.gridCell.count}`;

    switch (shape.type){
      case "navigation":
        classes += " navbar navbar-expand-lg navbar-dark bg-dark";
        break;
      case "footer":
        classes +=  " bd-footer";
        break;
      case "image":
        classes += " img-fluid";
        break;
      case "button":
        classes += " btn btn-primary";
        break;
      case "dropdown":
        classes += " dropdown";
        break;
      case "input":
        classes += " form-group";
        break;
      default:
        classes += shape.type;
    }

    return classes;

  }

  function resolveCustomAttributes(shape){

    // If shape is a type of container, we want to preserve the relative height.
    if (["container", "row"].indexOf(shape.type) !== -1) {
      return {
        style: `height:${shape.meta.relativeHeight}`
      }
    }

    if (shape.type == "image"){
      // Use template image for now.
      return {
        src: src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_167219acfd8%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_167219acfd8%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.09375%22%20y%3D%22104.6546875%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
      }
    }

    if (shape.type == "button"){
      return {
        type:"button"
      }
    }
  }

  function resolveCustomContent(shape){

    switch(shape.type){
      case "navigation":
      return [{
        elementType: 'a',
        attributes: {
          href: '#',
          class: "navbar-brand"
        },
        content: "Nav"
      }]
    }

    if (shape.type == "button"){
      return `Button ${shape.id}`
    }

    if (shape.type == "dropdown"){
      return [{
        elementType: 'button',
        attributes: {
          class: "btn btn-secondary dropdown-toggle",
          id: `dropdown_${shape.id}`,
          'data-toggle': "dropdown",
          'arias-haspopup': "true",
          'aria-expanded':"false"
        },
        content: `Dropdown ${shape.id}`
      },
      {
        elementType: 'div',
        attributes: {
          class: 'dropdown-menu',
          'aria-labelledby': `dropdown_${shape.id}`
        },
        content: [
          {
            elementType: 'a',
            attributes: {
              class: 'dropdown-item',
              href: "#"
            },
            content: 'Item 1'
          },
          {
            elementType: 'a',
            attributes: {
              class: 'dropdown-item',
              href: "#"
            },
            content: 'Item 2'
          }
        ]
      }
    ]
    }

    if (shape.type == "input"){
      return [{
        elementType: 'label',
        attributes: {
          for: `input_${shape.id}`
        },
        content: 'Enter text below.'
      },
      {
        elementType: 'input',
        attributes: {
          type: 'text',
          class: 'form-control',
          placeholder: `Input ${shape.id}`,
          id: `input_${shape.id}`
        }
      }
      ]
    }

    if (shape.type == "header"){
      return [{
        content: 'Header'
      }]
    }

    if (shape.type == "paragraph"){
      return [{
        content: "Lorem ipsum dolor amet"
      }]
    }

    return [{
      elementType: 'span',
      attributes: {
        'class': 'meta hidden'
      },
      content: {
        elementType: 'label',
        content: shape.id
      }
    },
    ...shape.contains.map(shape => new BootstrapObject(shape))];

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
