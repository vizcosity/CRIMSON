/**
 * Class defining shape primitive for use with the frontend, when creating
 * new primitives.
 *
 * @ Aaron Baw 2018
 */

export default class Primitive {
  constructor(id, parent, type="container", meta={
    absoluteWidth:50,
    absoluteHeight: 50
  }){
    this.id = id;
    this.parentId = parent.id;
    this.draw = true;
    this.meta = {
      ...meta,
      relativeWidth: `${(meta.absoluteWidth / parent.absoluteWidth) * 100}%`,
      relativeHeight: `${(meta.absoluteHeight / parent.absoluteHeight) * 100}%`,
    };

  }
}
