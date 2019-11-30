/**
 * This module creats placeholder content for images, paragraphs, headers, lists
 * and other components which do not have any set content.
 *
 * @ Aaron Baw 2019
 */

 // const dummyText = require('mayonnaise.js');
 const TextGenerator = require('sentence-generator');
 const generator = TextGenerator(__dirname + '/source.txt');
 const request = require('request');
 const NounProject = require('the-noun-project');
 const nounProjectCreds = require('../../config/config').api.nounProject;

// Logo collections from the noun-project which are used for branding.
const _LOGO_COLLECTIONS = [20469];

const nounProject = new NounProject({
  ...nounProjectCreds
});

var contentStore = {};

// Returns a new URL for a random image (even though the url itself will return
// a random image) - so that different image components have different URLs, and
// as such will force the browser to make repeated GET requets and ensure that
// each image is unique.
const randomImageUrl = shape => new Promise((resolve, reject) => {

  // if (contentStore[shape.id]) return resolve(contentStore[shape.id]);

  // console.log(`PLACEHOLDER | Fetching placeholder image from unsplash.`);

  // // Make a new request and convert the bytes recived into a base64 array.
  // request({
  //   method: 'GET',
  //   url:'http://source.unsplash.com/random/700x700?id='+new Date().getTime(),
  //   encoding: null
  // }, (err, res, body) => {
  //   console.log(body.t)
  //   var base64 = new Buffer(body).toString('base64');
  //   console.log(`PLACEHOLDER | Fetched placeholder image:`, base64.length);
  //   var src = `data:image/jpeg;base64,${base64}`;
  //   contentStore[shape.id] = src;
  //   return resolve(src);
  // })

  return resolve(`http://source.unsplash.com/collection/${shape.id}/400x400`);

});

// Generates dummy content for a series of text-based shape primitives, with
// content sourced courtesy of Patrick Star.
const generateDummyContent = shape => {

  switch (shape.type){
    case 'header':
      return generator.take(1).split(' ')[0];
    case 'paragraph':
      return generator.take(1);
    case 'text':
      return generator.take(1).split(' ')[0];
    default:
      return generator.take(1).split(' ')[0];
  }

};

const getPlaceholderLogoUrl = () => new Promise((resolve, reject) => {
  nounProject.getCollectionIconsById(random(_LOGO_COLLECTIONS), (err, res) => {

    // If there is no response from the server, return an empty string.
    if (err || !res) return resolve("");

    return resolve(random(res.icons.map(item => item.preview_url_84)));
  });
});


module.exports = {
  randomImageUrl,
  generateDummyContent,
  getPlaceholderLogoUrl
};

// Utility.
function log(...msg){
  if (process.env.DEBUG) console.log(`PLACEHOLDER |`, ...msg);
}

function random(array){
  return array[Math.floor(Math.random() * array.length)];
}
