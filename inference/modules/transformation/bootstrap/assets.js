/**
 * Static assets for the Bootstrap transformer.
 *
 * @ Aaron Baw 2019
 */

const BootstrapObject = require('./bootstrapObject');

module.exports = {
  hamburgerButton: {
    elementType: 'button',
    attributes: {
      class: 'navbar-toggler',
      type: 'button',
      "data-toggle": 'collapse',
      "data-target": "#navbarItemContainer",
      "aria-controls": "navbarItemContainer",
      "aria-expanded": "false",
      "aria-label": "Toggle navigation"
    },
    content: {
      elementType: 'span',
      attributes: { class: 'navbar-toggler-icon' },
      content: ""
    }
  }
}
