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
  },
  loginButton: [
    {
      elementType: {
        open: '<%',
        close: '%>'
      },
      content: ' if (!locals.username) { '
    },
    {
      elementType: 'a',
      attributes: { class: 'btn btn-primary', href: '/login' },
      content: 'Login'
    },
    {
      elementType: {
        open: '<%',
        close: '%>'
      },
      content: ' } else { '
    },
    {
      elementType: 'a',
      attributes: { class: 'btn btn-secondary', href: '/logout' },
      content: 'Logout'
    },
    {
      elementType: {
        open: '<%',
        close: '%>'
      },
      content: ' } '
    }
  ]
}
