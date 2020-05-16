/**
 * ACR module - holds JS definitions of different primitive classes and useful
 * utility functions for manipulating the primitives.
 */

// Dependencies.
import {
  calculateMidPoint,
  Point, 
  sortVertices,
  Size
} from './geometry';
import { start } from 'repl';

/**
 * Metadata for an Abstract Component Representation object, containing positional and size information for a given primitive.
 */
interface ACRObjectMetadata {
  absoluteWidth: number;
  absoluteHeight: number;

  // Ensure that the relativeWidthValues are also read only - and computed properties.
  // Previously, relative sizing values were correclty computed by taking into account the parent primtive, but 
  // *only* during instantiation. It is uncommon that the parent primitive is assigned during instantiation, however, 
  // so it is crucial that we ensure these are calculated dynamically.
  readonly relativeWidthValue: number;
  readonly relativeHeightValue: number;

  readonly relativeWidth:  string;
  readonly relativeHeight: string;

  readonly area: number; 

  vertices: Point[];
  initialVertices: Point[];

  readonly midpoint: Point | [];

}

class ACRObject {

  id: string;
  parentId: string;
  
  private _parent: ACRObject;

  draw: boolean;

  dragging: boolean;
  
  meta: ACRObjectMetadata;

  type: string;

  get level(): number {
    
    // Recursively traverse the parent tree until there are no more parents.
    let level = -1;
    let parent: any = this;
    while (parent && parent.parent) {parent = parent.parent; level++;}

    return level;

  }

  contains: ACRObject[];

  get parent(): ACRObject{
    return this._parent
  };

  set parent(newValue: ACRObject){
    this._parent = newValue;
  };


  constructor({id, parent: _parent, type, vertices = [], level=0}){

    var xs = vertices.map(([x, _]) => x).sort().reverse();
    var ys = vertices.map(([_, y]) => y).sort().reverse();
    var absoluteWidth = Math.abs(xs[0] - xs[xs.length - 1]);
    var absoluteHeight = Math.abs(ys[0] - ys[ys.length - 1]);

    if (!_parent){ 
      _parent = {
        id: "None",
        meta: {
          absoluteWidth: absoluteWidth,
          absoluteHeight: absoluteHeight
        }
      }
      //console.log(`Constructing implicit parent object.`);
    }

    // let relativeWidthValue = absoluteWidth / parent.meta.absoluteWidth;
    // if (isNaN(relativeWidthValue)) relativeWidthValue = 0;
    // let relativeWidth = `${(relativeWidthValue) * 100}%`;
    // let relativeHeightValue = absoluteHeight / parent.meta.absoluteHeight;
    // if (isNaN(relativeHeightValue)) relativeHeightValue = 0;
    // let relativeHeight = `${(relativeHeightValue) * 100}%`;

    // console.log(`Called constructor with vertices:`, vertices, `and id`, id);

    // Maintain a reference to 'this' which can be used within the 'meta' object.
    var self = this;

    this.id = id;
    this.parentId = _parent.id;
    this._parent = _parent;
    this.type = type;
    this.draw = true;
    this.meta = {

      absoluteWidth,
      absoluteHeight,

      get relativeWidthValue(){
        //console.log(`Calculating relative width, with parent:`, self.parent, this.absoluteWidth, self.parent.meta.absoluteWidth, this);
        let relativeWidthValue = this.absoluteWidth / self.parent.meta.absoluteWidth;
        if (isNaN(relativeWidthValue)) relativeWidthValue = 0;
        return relativeWidthValue;
      },

      get relativeHeightValue(){
        let relativeHeightValue = this.absoluteHeight / self.parent.meta.absoluteHeight;
        if (isNaN(relativeHeightValue)) relativeHeightValue = 0;
        return relativeHeightValue;
      },

      get relativeWidth(){
        return `${this.relativeWidthValue * 100}%`;
      },

      get relativeHeight(){
        return `${this.relativeHeightValue * 100}%`;
      },

      get area(){
        return this.absoluteWidth * this.absoluteHeight;
      },

      vertices: sortVertices(vertices),
      
      // Save a copy of the initial vertices for the object for the purposes of
      // calculating resizing deltas, etc.
      initialVertices: sortVertices(vertices).concat(),
      
      get midpoint(){ 
        return calculateMidPoint(this.vertices)
      },

      // relativeVertices: [
      //   [0,0],
      //   [0,1],
      //   [1,1],
      //   [1,0]
      // ],

    };
      this.contains = [];
  }

  addContainingShape(otherShape){

    // console.log(`Adding`, otherShape.id, `to`, this.id);

    // Set the new parent ID for the other shape.
    otherShape.parentId = this.id;

    // Ensure that the other shape has this shape as its parent.
    otherShape.parent = this;

    // Adjust the relative width and height of the otherShape.
    //otherShape.meta.relativeWidth = `${(otherShape.meta.absoluteWidth / this.meta.absoluteWidth) * 100}%`;
    //otherShape.meta.relativeHeight = `${(otherShape.meta.absoluteHeight / this.meta.absoluteHeight) * 100}%`;

    // Adjust the relative vertices.
    var [ox, oy] = this.meta.vertices[0];

    // for (var i = 0; i < otherShape.meta.vertices.length; i++){
    //   otherShape.meta.vertices[i] = [
    //     (otherShape.meta.vertices[i][0] - ox) / this.meta.absoluteWidth,
    //     (otherShape.meta.vertices[i][1] - oy) / this.meta.absoluteHeight,
    //   ];
    // }

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
      //this.meta.midpoint = calculateMidPoint(this.meta.vertices);

      // Displace all contained objects recursively.
      // TODO: Understand why contained acrObjects are undefined, or are not instances of the ACRObject class.
      this.contains.forEach(acrObject => acrObject.displace({x, y}));

  }

  // Non-mutating version of the above.
  displaced(deltas){
    let displacedObject = ACRObject.fromJSON({...this});
    displacedObject.displace(deltas);
    return displacedObject;
  }

  // Given a JSON ACR Object, which is not already an instance of the ACRObject class,
  // creates an instance of the ACRObject.
  static fromJSON(json: ACRObject | ACRObject[] | any){

    // If the incoming object is an array, map each json object to an ACRObject instance.
    if (Array.isArray(json)) return json.map(acrObject => ACRObject.fromJSON(acrObject));

    let startObject = new ACRObject({
      id: json.id,
      parent: json.parent,
      type: json.type,
      vertices: json.meta.vertices,
    });

    if (json.parentId)
      startObject.parentId = json.parentId;
    if (json.dragging)
      startObject.dragging = json.dragging;
    if (json.draw)
      startObject.draw = json.draw;
    if (json.id)
      startObject.id = json.id;
      
    if (json.meta.absoluteHeight)
      startObject.meta.absoluteHeight = json.meta.absoluteHeight;
    if (json.meta.absoluteWidth)
      startObject.meta.absoluteWidth = json.meta.absoluteWidth;
    // if (json.meta.relativeWidthValue)
    //   startObject.meta.relativeWidthValue = json.meta.relativeWidthValue;
    // if (json.meta.relativeHeightValue)
    //   startObject.meta.relativeHeightValue = json.meta.relativeHeightValue;

    // Assign 'initialVertices' if this has not been done already.
    //if (!startObject.meta.initialVertices) startObject.meta.initialVertices = startObject.meta.vertices.concat();

    // Recursively map all containing shapes to ACRObjects.
    // startObject.contains = ACRObject.fromJSON(json.contains).map(primitive => {return {...primitive, parent: startObject}});

    json.contains.forEach(jsonPrimitive => {
      startObject.addContainingShape(ACRObject.fromJSON(jsonPrimitive));
    });

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

export { ACRObject, Rectangle, Container, Row };
