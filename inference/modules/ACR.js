/**
 * ACR module - holds JS definitions of different primitive classes and useful
 * utility functions for manipulating the primitives.
 */

// Dependencies.
const {
  findACRObjectById,
  calculateMidPoint
} = require('./geometry');

class ACRObject {

  constructor({id, parent, type, vertices = [], level=0}){

    var xs = vertices.map(([x, _]) => x).sort().reverse();
    var ys = vertices.map(([_, y]) => y).sort().reverse();
    var absoluteWidth = Math.abs(xs[0] - xs[xs.length - 1]);
    var absoluteHeight = Math.abs(ys[0] - ys[ys.length - 1]);

    if (!parent){ 
      parent = {
        id: "None",
        meta: {
          absoluteWidth: absoluteWidth,
          absoluteHeight: absoluteHeight
        }
      }
    }

    let relativeWidthValue = absoluteWidth / parent.meta.absoluteWidth;
    if (isNaN(relativeWidthValue)) relativeWidthValue = 0;
    let relativeWidth = `${(relativeWidthValue) * 100}%`;
    let relativeHeightValue = absoluteHeight / parent.meta.absoluteHeight;
    if (isNaN(relativeHeightValue)) relativeHeightValue = 0;
    let relativeHeight = `${(relativeHeightValue) * 100}%`;

    this.id = id;
    this.parentId = parent.id;
    this.type = type;
    this.draw = true;
    this.meta = {
      absoluteWidth,
      absoluteHeight,
      relativeWidth,
      relativeHeight,
      area: absoluteWidth * absoluteHeight,
      vertices: vertices,
      // Save a copy of the initial vertices for the object for the purposes of
      // calculating resizing deltas, etc.
      initialVertices: vertices.concat(),
      midpoint: calculateMidPoint(vertices),
      // relativeVertices: [
      //   [0,0],
      //   [0,1],
      //   [1,1],
      //   [1,0]
      // ],
    };
      this.level = level;
      this.contains = [];
  }

  addContainingShape(otherShape){

    // Set the new parent ID for the other shape.
    otherShape.parentId = this.id;

    // Adjust the relative width and height of the otherShape.
    otherShape.meta.relativeWidth = `${(otherShape.meta.absoluteWidth / this.meta.absoluteWidth) * 100}%`;
    otherShape.meta.relativeHeight = `${(otherShape.meta.absoluteHeight / this.meta.absoluteHeight) * 100}%`;

    // Adjust the relative vertices.
    var [ox, oy] = this.meta.vertices[0];

    // for (var i = 0; i < otherShape.meta.vertices.length; i++){
    //   otherShape.meta.relativeVertices[i] = [
    //     (otherShape.meta.vertices[i][0] - ox) / this.meta.absoluteWidth,
    //     (otherShape.meta.vertices[i][1] - oy) / this.meta.absoluteHeight,
    //   ];
    // }

    // Increase the nesting level for the other shape.
    otherShape.level++;

    this.contains.push(otherShape);

  }

  // MARK: Constructor utilities.
  calculateMidPoint(vertices){
    return vertices.length !== 0 ? [
      vertices.map(([x, y]) => x).reduce((prev, curr) => prev + curr) / vertices.length,
      vertices.map(([x, y]) => y).reduce((prev, curr) => prev + curr) / vertices.length
    ] : [];
  }

  // MARK: Movement operators.

  // Mutates the object, displacing it x units or y units.
  displace({x = 0,y = 0}){
      this.meta.vertices = this.meta.vertices.map(([xVert, yVert]) => [xVert+x, yVert+y]);
      this.meta.midpoint = calculateMidPoint(this.meta.vertices);
  }

  // Non-mutating version of the above.
  displaced(deltas){
    let displacedObject = ACRObject.fromJSON({...this});
    displacedObject.displace(deltas);
    return displacedObject;
  }

  // Given a JSON ACR Object, which is not already an instance of the ACRObject class,
  // creates an instance of the ACRObject.
  static fromJSON(json){

    // If the incoming object is an array, map each json object to an ACRObject instance.
    if (Array.isArray(json)) return json.map(acrObject => ACRObject.fromJSON(acrObject));

    let startObject = new ACRObject({...json});
    Object.assign(startObject, json);

    // Assign 'initialVertices' if this has not been done already.
    if (!startObject.meta.initialVertices) startObject.meta.initialVertices = startObject.meta.vertices.concat();

    // Recursively map all containing shapes to ACRObjects.
    startObject.contains = ACRObject.fromJSON(startObject.contains);

    return startObject;

  }

}

class Rectangle extends ACRObject {
  constructor({
    id,
    parent,
    midpoint,
    vertices,
    width,
    height,
    top,
    left,
    level,
    type
  }){

    if (!type) type = "rectangle";

    if (!vertices && midpoint){
      var [ mx, my ] = midpoint;
      var dx = width/2;
      var dy = height/2;
      vertices = [
        [mx - dx, my-dy],
        [mx - dx, my+dy],
        [mx + dx, my+dy],
        [mx + dx, my-dy]
      ];
    }

    if (!vertices && left && top){
      vertices = [
        [left, top],
        [left, top+height],
        [left+width, top+height],
        [left+width, top]
      ]
    }

    console.log(`Created vertices:`, left, top);

    super({id, parent, type, vertices, level});

  }
}

class Container extends Rectangle {
  constructor(params) {
    super({type: "container", ...params})
  }
}

class Row extends Container {
  constructor(params) {
    super({type: "row", ...params})
  }
}

module.exports = { ACRObject, Rectangle, Container, Row };
