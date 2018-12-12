/**
 * Detection of certain primitives are predicated on the need to determine whether or not
 * the shape is a derived instance of some higher level class type. This script provides
 * methods in order to determine this.
 *
 * @ Aaron Baw 2018
 */

const inheritance = require("../config/config.json").inheritance;

function getDerivationSubTree(tree, type){

  console.log("Getting subtree from ", type, tree);
  // return false;

  if (Array.isArray(tree)) {
    // Convert to tree format.
    var converted = {};
    tree.forEach(item => {
      if (typeof item == "object") converted = {...item, ...converted};
      else converted[item] = {}
    });
    console.log('Converted', tree, 'to', converted);
    tree = converted;
    // console.log('')
  }

  // var subtree = JSON.parse(JSON.stringify(tree[type]));
  // console.log(typeof subtree);
  // if (typeof subtree != 'undefined') return subtree;
  if (tree[type]) {
    console.log(tree)
    console.log(JSON.stringify(tree[type]))
    return JSON.parse(JSON.stringify((tree[type])))
  };

  Object.keys(tree).forEach(treeType => {
    var possibleSubTree = getDerivationSubTree(tree[treeType], type);
    if (possibleSubTree) return possibleSubTree;
  });

}

// Traverses entire tree and returns true if the tree contains an instance of the
// type along its children, recursively expanding its search throughout the
// depth of the tree.
const findInstance = (tree, type) => {

  var keys = Array.isArray(tree) ? tree : Object.keys(tree);

  if (keys.indexOf(type) !== -1) return true;

  keys.forEach(treeType => {
    if (findInstance(tree[treeType], type)) return true;
  })
}

const isSubtypeOf = (type, shape) => {

  // Get the portion of the subtree containing the derived classes for the passed
  // type.
  const subtree = getDerivationSubTree(inheritance, type);

  console.log("Obtained subtree", getDerivationSubTree(inheritance, type));

  if (!subtree) return false;

  // Check if the current level contains the parent type we are looking for. If so,
  // recurse at that level.
  return findInstance(subtree, shape.type);

  // We may be 'in' the portion of the tree that the type indexes. At this point, we
  // simply need to check all of the values and see if they match up with the
  // type of the shape. If we encounter another object, we simply recurse along that object.

}

module.exports = isSubtypeOf;
