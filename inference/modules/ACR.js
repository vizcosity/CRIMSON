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

    if (!parent) parent = {
      id: "None",
      meta: {
        absoluteWidth: absoluteWidth,
        absoluteHeight: absoluteHeight
      }
    }

    this.id = id;
    this.parentId = parent.id;
    this.type = type;
    this.draw = true;
    this.meta = {
      absoluteWidth: absoluteWidth,
      absoluteHeight: absoluteHeight,
      relativeWidth: `${(absoluteWidth / parent.meta.absoluteWidth) * 100}%`,
      relativeHeight: `${(absoluteHeight / parent.meta.absoluteHeight) * 100}%`,
      area: absoluteWidth * absoluteHeight,
      vertices: vertices,
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
  static fromJSON(object){

    let startObject = new ACRObject({...object});
    Object.assign(startObject, object);
    return startObject;

  }

}

class Rectangle extends ACRObject {
  constructor({id, parent, midpoint, width, height, level, type}){

    if (!type) type = "rectangle";

    var [ mx, my ] = midpoint;
    var dx = width/2;
    var dy = height/2;

    super({id, parent, type, vertices: [
      [mx - dx, my-dy],
      [mx - dx, my+dy],
      [mx + dx, my+dy],
      [mx + dx, my-dy]
    ], level});

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
