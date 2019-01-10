/**
 * ACR module - holds JS definitions of different primitive classes and useful
 * utility functions for manipulating the primitives.
 */

class ACRObject {
  constructor(id, parent, type, vertices, level=0){

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
      midpoint: [
        vertices.map(([x, y]) => x).reduce((prev, curr) => prev + curr) / vertices.length,
        vertices.map(([x, y]) => y).reduce((prev, curr) => prev + curr) / vertices.length

      ],
      relativeVertices: [
        [0,0],
        [0,1],
        [1,1],
        [1,0]
      ],
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
    for (var i = 0; i < otherShape.meta.vertices.length; i++){
      otherShape.meta.relativeVertices[i] = [
        (otherShape.meta.vertices[i][0] - ox) / this.meta.absoluteWidth,
        (otherShape.meta.vertices[i][1] - oy) / this.meta.absoluteHeight,
      ];
    }

    // Increase the nesting level for the other shape.
    otherShape.level++;

    this.contains.push(otherShape);

  }

}

class Rectangle extends ACRObject {
  constructor({id, parent, midpoint, width, height, level, type}){

    if (!type) type = "rectangle";

    var [ mx, my ] = midpoint;
    var dx = width/2;
    var dy = height/2;
    super(id, parent, type, [
      [mx - dx, my-dy],
      [mx - dx, my+dy],
      [mx + dx, my+dy],
      [mx + dx, my-dy]
    ], level);

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
