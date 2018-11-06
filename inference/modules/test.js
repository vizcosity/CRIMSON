var detectContainer = require('./detectContainer');

detectContainer('../../detection/test/images/rect.png').then(shapes => {
  console.log(JSON.parse(shapes));
})
