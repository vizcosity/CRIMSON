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
const { randomImageUrl } = require('./placeholder');

function BootstrapObject(shape){

  // if (!shape.content) log("Transforming shape", shape);

  this.shape = shape;

  // If there is no element type, but the argument is defined, then we assume that
  // the object should simply be a string that is returned.
  this.elementType = typeMap[shape.type] ? typeMap[shape.type] : (shape.type ? 'div' : null);

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

    if (shape.gridCell && shape.gridCell.count) classes +=  ` column container col-${shape.gridCell.count}`;

    switch (shape.type){
      case "navigation":
        classes += " navbar navbar-expand-lg navbar-light bg-light";
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
      case "card_text_button":
        classes += " card";
        break;
      case "panel":
        classes += " container panel";
        break;
      default:
        classes += ` ${shape.type}`;
    }

    return classes;

  }

  function resolveCustomAttributes(shape){

    // If shape is a type of container, we want to preserve the relative height.
    if (["container", "row"].indexOf(shape.type) !== -1) {
      return {
        // style: `height:${shape.meta.relativeHeight}`
      }
    }

    if (shape.type == "image"){
      // Use template image for now.
      return {
        // src: src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_167219acfd8%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_167219acfd8%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.09375%22%20y%3D%22104.6546875%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
        src: randomImageUrl(shape)
      }
    }

    if (shape.type == "button"){
      return {
        type:"button",
        tabindex: '0'
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
      return `Click here`
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
        content: `Select`
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
        elementType: 'input',
        attributes: {
          type: 'text',
          class: 'form-control',
          placeholder: `Enter text here.`,
          id: `input_${shape.id}`
        }
      }
      ]
    }

    if (shape.type == "header"){
      return shape.content ? shape.content : 'Header';
    }

    if (shape.type == "paragraph"){
      return shape.content ? shape.content : "Lorem ipsum dolor amet";
    }

    if (shape.type == "card_text_button"){
      var cardTitle = new BootstrapObject(shape.contains[0]);
      cardTitle.addClass('card-title');
      // log(`Card Title:`, cardTitle);
      var cardBody = new BootstrapObject(shape.contains[1]);
      // log(`Card Body:`, cardBody);
      cardBody.addClass('card-text');
      var cardBtn = new BootstrapObject(shape.contains[2]);


      return [{
        elementType: 'div',
        content: {
          elementType: 'div',
          attributes: {
            class: 'card-body'
          },
          content: [cardTitle, cardBody, cardBtn]
        }
      }]
    }

    if (shape.type == "card_image_text_button") {

      var cardImg = new BootstrapObject(shape.contains[0]);

      var cardTitle = new BootstrapObject(shape.contains[1]);

      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title` : 'card-title';

      var cardBody = new BootstrapObject(shape.contains[2]);

      cardBody.attributes.class = cardBody.attributes.class ? `${cardBody.attributes.class} card-text` : 'card-text';

      var cardBtn = new BootstrapObject(shape.contains[3]);

      return [{
                elementType: 'div',
                attributes: {
                  class: 'card'
                  // TODO: Check if we need to set a custom width here, or if it can be
                  // handled by assigning grid cells.
                },
                content: [{
                  elementType: 'div',
                  attributes: {
                    class: 'card'
                  },
                  content: [ cardImg,
                      {
                        elementType: 'div',
                        attributes: { class: 'card-body' },
                        content: [cardTitle, cardBody, cardBtn]
                      }
                    ]
                  }]
              }]
    }

    if (shape.type == "card_image_text"){
      var cardImg = new BootstrapObject(shape.contains[0]);
      cardImg.attributes.class = cardImg.attributes.class ? `${cardImg.attributes.class} card-img-top`: 'card-img-top';
      var cardTitle = new BootstrapObject(shape.contains[1]);
      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title` : 'card-title';
      // Set the header to h5.
      cardTitle.elementType = 'h5';
      var cardBody = new BootstrapObject(shape.contains[2]);
      cardBody.attributes.class = cardBody.attributes.class ? `${cardBody.attributes.class} card-text`: 'card-text';

      return [{
        elementType: 'div',
        attributes: { class: 'card' },
        content: [ cardImg, {
          elementType: 'div',
          attributes: { class: 'card-body' },
          content: [cardTitle, cardBody]
        }]
      }];
    }

    if (shape.type == "card_centered_content") {

      var cardTitle = new BootstrapObject(shape.contains[0]);
      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title`: 'card-title';
      var cardBody = new BootstrapObject(shape.contains[1]);
      cardBody.attributes.class = cardBody.attributes.class ? `${cardBody.attributes.class} card-text` : 'card-text';


      return [{
        elementType: 'div',
        attributes: { class: 'card text-center' },
        content: [{
          elementType: 'div',
          attributes: { class: 'card-body' },
          content: [cardTitle, cardBody]
        }]
      }]
    }

    // Hero text without image maps to a jumbotron in bootstrap.
    if (shape.type == "hero_text"){
      var jumbTitle = new BootstrapObject(shape.contains[0]);
      jumbTitle.attributes.class = jumbTitle.attributes.class ? `${jumbTitle.attributes.class} display-4` : 'display-4';
      var jumbSubheader = new BootstrapObject(shape.contains[1]);
      jumbSubheader.attributes.class = jumbSubheader.attributes.class ? `${jumbSubheader.attributes.class} lead` : 'lead';


      return [{
        elementType: 'div',
        attributes: { class: 'container' },
        content: [jumbTitle, jumbSubheader]
      }];
    }

    if (shape.type == "list_vertical"){

      var items = shape.contains.map(shape => {
        var item = new BootstrapObject(shape);
        item.attributes.class = item.attributes.class ? `${item.attributes.class} list-group-item` : 'list-group-item';
        item.elementType = 'li';
        return item;
      });

      return [{
        elementType: 'div',
        attributes: { class: 'card' },
        content: [{
          elementType: 'ul',
          attributes: { class: 'list-group list-group-flush' },
          content: items
        }]
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

  // Instance methods for bootstrap objects.
  // Add a new class to the bootstrap object.
  this.addClass = function (newClass){
    this.attributes.class = this.attributes.class ? `${this.attributes.class} ${newClass}` : 'newClass';
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
