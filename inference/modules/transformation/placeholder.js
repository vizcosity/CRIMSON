/**
 * This module creats placeholder content for images, paragraphs, headers, lists
 * and other components which do not have any set content.
 *
 * @ Aaron Baw 2019
 */

// Returns a new URL for a random image (even though the url itself will return
// a random image) - so that different image components have different URLs, and
// as such will force the browser to make repeated GET requets and ensure that
// each image is unique.
function randomImageUrl(shape){

  if (typeof shape === "object") return `http://source.unsplash.com/random/${shape.id}`;
  if (parseInt(shape)) return `http://source.unsplash.com/random/${parseInt(shape)}`;
  return `http://source.unsplash.com/random/${Math.floor(Math.random()*100)}`;

}

module.exports = {
  randomImageUrl
};
