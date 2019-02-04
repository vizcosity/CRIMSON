/**
 * Context: Bootstrap.
 *
 * This module defines the *BootstrapObject* class which transforms Shape objects
 * into HTML pre-nodes which will then be embedded.
 *
 * @ Aaron Baw 2019
 *
 */


const typeMap = require('../typeToElementMap.json');
const { randomImageUrl, generateDummyContent, getPlaceholderLogoUrl } = require('../placeholder');
const { hamburgerButton, loginButton } = require('./assets');
const { inferNavbarBrand } = require('../../inference/inferTypes');

class BootstrapObject {

  constructor(shape){}

  static async create(shape){
    // log(`Constructor called:`, shape.type)
    let object = new BootstrapObject();
    return await object.init_(shape);
  }

  // Define an async function member constructor so that we can make asynchronous
  // calls to collect placeholder data.
  async init_(shape){

    this.shape = shape;
    // If there is no element type, but the argument is defined, then we assume that
    // the object should simply be a string that is returned.
    this.elementType = typeMap[shape.type] ? typeMap[shape.type] : (shape.type ? 'div' : null);

    // Assign attributes here first, so that resolveCustomAttributes has access
    // to the default attributes before making any changes.
    this.attributes = {
      'class': this.resolveClass(shape),
      // 'style': shape.level != 0 ? `height:${shape.meta.relativeHeight}` : "",
      'data-id': shape.id
    }

    let customAttributes = await this.resolveCustomAttributes(shape);
    this.attributes = {
      ...this.attributes,
      ...customAttributes
    }

    // if (this.shape.type === "navigation") log(`Beginning nav transform`)
    // Add shape id.
    this.content = await this.resolveCustomContent(shape);
    // if(this.shape.type === "navigation") log(`Finished nav transform`);
    return this;

  }


  resolveClass(shape){

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
      case "paragraph":
        classes += 'text-muted';
        break;
      default:
        classes += ` ${shape.type}`;
    }

    return classes;

  }

  async resolveCustomAttributes(shape){

    // If shape is a type of container, we want to preserve the relative height.
    if (["container", "row"].indexOf(shape.type) !== -1) {

      // Check if we need to fill in the space between grid cells where items
      // have all been assigned the same number of cells but do not add up to
      // 12.
      if (new Set(shape.contains.map(s => s.gridCell ? s.gridCell.count : 0)).size === 1)
      return {
        class: this.attributes.class ? `${this.attributes.class} row-fill-grid-space` : 'row-fill-grid-space'
      }

    }

    if (shape.type == "image"){
      // Use template image for now.
      return {
        // src: src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_167219acfd8%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_167219acfd8%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.09375%22%20y%3D%22104.6546875%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
        src: await randomImageUrl(shape),
        // style: `
        //   max-width: ${shape.meta.relativeWidth}
        // `
      }
    }

    if (shape.type == "button"){
      return {
        type:"button",
        tabindex: '0'
      }
    }
  }

  async resolveNavItem(shape){
    switch (shape.type){
      case 'header':
      case 'text':

        var textElement = await BootstrapObject.create(shape);
        textElement.elementType = 'a';
        textElement.addClass('nav-link');
        textElement.attributes.href = '#';

        return {
          elementType: 'li',
          attributes: { class: 'nav-item' },
          content: textElement
        };
      case 'navbar_brand,header':
      case 'navbar_brand,text':
        var transformedShape = await BootstrapObject.create({
          ...shape,
          type: shape.type.split(',')[1]
        });
        transformedShape.elementType = 'a';
        transformedShape.addClass('navbar-brand');
        return transformedShape;
      case 'paragraph':
        var transformedShape = await BootstrapObject.create(shape);
        transformedShape.elementType = 'span';
        transformedShape.addClass('navbar-text');
        return transformedShape;
      break;
      case 'navbar_brand,image':
        var image = await BootstrapObject.create({
          ...shape,
          type: 'image'
        });
        image.attributes.width = 30;
        image.attributes.height = 30;
        image.attributes.style = image.attributes.style ? `${image.attributes.style} filter: invert(50%);` : 'filter: invert(50%);';
        image.attributes.src = await getPlaceholderLogoUrl();

        // Nest the image within an 'a' container.
        return {
          elementType: 'a',
          attributes: { class: 'navbar-brand', href: '#' },
          content: image
        };
        break;
      case 'image':
        var image = await BootstrapObject.create(shape);
        image.attributes.width = 30;
        image.attributes.height = 30;

        // Nest the image within an 'a' container.
        return {
          elementType: 'a',
          attributes: { class: 'navbar-brand', href: '#' },
          content: image
        };
        return image;
      break;
      case 'dropdown':
        var dropdown = await BootstrapObject.create(shape);
        dropdown.content[0].elementType = 'a';
        dropdown.content[0].removeClass('btn btn-secondary');
        return {
          elementType: 'li',
          attributes: { class: 'nav-item dropdown' },
          content: dropdown
        };
      break;
      case 'button':

        var button = await BootstrapObject.create(shape);
        button.attributes.class = 'btn btn-outline-secondary';

        // If content matches 'login', then we wrap the prenode in an ejs
        // control flow statement.
        // Ensure that the project type is a server before inferring, as inserting
        // ejs template syntax will break static code.
        if (
            shape.generateAuth && 
            shape.content.toLowerCase &&
            shape.content.toLowerCase() == "login"
          ) button = loginButton;

        return {
          elementType: 'form',
          attributes: { class: 'form-inline' },
          content: button
        };
      break;
      case 'input':
        var input = await BootstrapObject.create(shape);
        return {
          elementType: 'form',
          attributes: { class: 'form-inline' },
          content: input
        };
      break;
      default:
        return await BootstrapObject.create(shape);

    }
  }

  // Resolves navigation by transforming child elements correctly.
  async resolveNavigationContent(nav){

    // Infer navbar-brand elements specific to Bootstrap.
    var { nav, navBrand } = inferNavbarBrand(nav);

    // log(`Inferring navigation:`, nav.contains.map(s => Object({id:s.id, type:s.type})))

    // Shapes we have to wrap in a <form> component.
    var formItems = nav.contains.filter(shape => shape.type === "button" || shape.type === "input");
    var formItemIds = formItems.map(s => s.id);

    // List items.
    var listItems = nav.contains.filter(shape => formItemIds.indexOf(shape.id) === -1 && (!navBrand || shape.id !== navBrand.id));

    // Transform each navigation item appropriately. Text and headers should be
    // transformed into links, forms into inlne-forms, and image content
    // should be navbar-brand appropriate.
    formItems = await Promise.all(formItems.map(shape => this.resolveNavItem(shape)));
    // log(`Attempting to generate navbrand,`, navBrand ? navBrand.type : "undefined");
    if (navBrand) navBrand = await this.resolveNavItem(navBrand);
    listItems = await Promise.all(listItems.map(shape => this.resolveNavItem(shape)));

    var output = [];
    // log(`Generated navbrand`, navBrand)
    if (navBrand)
      output.push(navBrand);

    var collapseContainer = {
      elementType: 'div',
      attributes: { class: 'collapse navbar-collapse', id: 'navbarItemContainer' },
      content: []
    };


    if (listItems.length !== 0)
      collapseContainer.content.push({
        elementType: 'ul',
        attributes: { class: 'navbar-nav mr-auto' },
        content: listItems
      });

    if (formItems.length !== 0)
      collapseContainer.content.push({
        elementType: 'form',
        attributes: { class: 'form-inline' },
        content: formItems
      });

    output.push(hamburgerButton);
    output.push(collapseContainer);

    // log(`Resolved navigation content:`, output);

    return output;
}

  async resolveCustomContent(shape){

    switch(shape.type){
      case "navigation":
      var resolved = await this.resolveNavigationContent(shape);
      return resolved;
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
      return shape.content ? shape.content : generateDummyContent(shape);
    }

    if (shape.type == "paragraph"){
      return shape.content ? shape.content : generateDummyContent(shape);
    }

    if (shape.type == "card_text_button"){
      var cardTitle = await BootstrapObject.create(shape.contains[0]);
      cardTitle.addClass('card-title');
      // log(`Card Title:`, cardTitle);
      var cardBody = await BootstrapObject.create(shape.contains[1]);
      // log(`Card Body:`, cardBody);
      cardBody.addClass('card-text');
      var cardBtn = await BootstrapObject.create(shape.contains[2]);


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

      var cardImg = await BootstrapObject.create(shape.contains[0]);

      var cardTitle = await BootstrapObject.create(shape.contains[1]);

      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title` : 'card-title';

      var cardBody = await BootstrapObject.create(shape.contains[2]);

      cardBody.attributes.class = cardBody.attributes.class ? `${cardBody.attributes.class} card-text` : 'card-text';

      var cardBtn = await BootstrapObject.create(shape.contains[3]);

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
      var cardImg = await BootstrapObject.create(shape.contains[0]);
      cardImg.attributes.class = cardImg.attributes.class ? `${cardImg.attributes.class} card-img-top`: 'card-img-top';
      var cardTitle = await BootstrapObject.create(shape.contains[1]);
      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title` : 'card-title';
      // Set the header to h5.
      cardTitle.elementType = 'h5';
      var cardBody = await BootstrapObject.create(shape.contains[2]);
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

      var cardTitle = await BootstrapObject.create(shape.contains[0]);
      cardTitle.attributes.class = cardTitle.attributes.class ? `${cardTitle.attributes.class} card-title`: 'card-title';
      var cardBody = await BootstrapObject.create(shape.contains[1]);
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
      var jumbTitle = await BootstrapObject.create(shape.contains[0]);
      jumbTitle.attributes.class = jumbTitle.attributes.class ? `${jumbTitle.attributes.class} display-4` : 'display-4';
      var jumbSubheader = await BootstrapObject.create(shape.contains[1]);
      jumbSubheader.attributes.class = jumbSubheader.attributes.class ? `${jumbSubheader.attributes.class} lead` : 'lead';


      return [{
        elementType: 'div',
        attributes: { class: 'container' },
        content: [jumbTitle, jumbSubheader]
      }];
    }

    if (shape.type == "list_vertical"){

      var items = await Promise.all(shape.contains.map(async shape => {
        var item = await BootstrapObject.create(shape);
        item.attributes.class = item.attributes.class ? `${item.attributes.class} list-group-item` : 'list-group-item';
        item.elementType = 'li';
        return item;
      }));

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
    ...await Promise.all(shape.contains.map(shape => BootstrapObject.create(shape)))];

  }

  // Instance methods for bootstrap objects.
  // Add a new class to the bootstrap object.
  addClass (newClass){
    this.attributes.class = this.attributes.class ? `${this.attributes.class} ${newClass}` : 'newClass';
  }

  removeClass (oldClass){
    this.attributes.class.replace(oldClass, '');
  }

}

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`BootstrapObject |`, ...msg);
}

module.exports = BootstrapObject;
