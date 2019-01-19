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
    this.type = type;
    this.draw = true;
    this.meta = {
      ...meta,
      relativeWidth: `${(meta.absoluteWidth / parent.meta.absoluteWidth) * 100}%`,
      relativeHeight: `${(meta.absoluteHeight / parent.meta.absoluteHeight) * 100}%`,
      area: meta.absoluteWidth * meta.absoluteHeight,
      vertices: [
        [
          parent.meta.midpoint[0] - (meta.absoluteWidth / 2),
          parent.meta.midpoint[1] - (meta.absoluteHeight / 2)
        ],
        [
          parent.meta.midpoint[0] - (meta.absoluteWidth / 2),
          parent.meta.midpoint[1] + (meta.absoluteHeight / 2)
        ],
        [
          parent.meta.midpoint[0] + (meta.absoluteWidth / 2),
          parent.meta.midpoint[1] + (meta.absoluteHeight / 2)
        ],
        [
          parent.meta.midpoint[0] + (meta.absoluteWidth / 2),
          parent.meta.midpoint[1] - (meta.absoluteHeight / 2)
        ]
      ],
      midpoint: parent.meta.midpoint,
      relativeVertices: [
        [
          0.0,
          0.0
        ],
        [
          0.0,
          1.0
        ],
        [
          1.0,
          1.0
        ],
        [
          1.0,
          0.0
        ]
      ],
    };
      this.level = parent.level + 1;
      this.contains = [];

  }
}
