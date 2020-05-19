import React from 'react';
import Reactable from 'reactablejs';
import { getRelativeDistance } from 'crimson-inference/modules/geometry';

const BoundingBoxComponent = ({ 
  shape, 
  className,
  dragging,
  parent, 
  level, 
  contains,
  getRef, 
  selectable = true, 
  children,
}) => {
  var meta = shape.meta;

  // console.log(`Getting relative distance:`, parent, shape);

  let [left, top] = parent && parent.meta.vertices ? getRelativeDistance(parent, shape) : shape.meta.initialVertices[0];
  
  return (<div 
    ref={getRef} 
    className={"bounding-box " + className} 
    data-x={`${left}`} data-y={`${top}`} 
    data-height={meta.relativeHeight} 
    data-width={meta.relativeWidth} 
    data-abs-height={meta.absoluteHeight}
    data-abs-width={meta.absoluteWidth}
    data-id={shape.id} 
    onContextMenu={e => e.preventDefault()}
    style={{
      height: `${meta.relativeHeight}`,
      width: `${meta.relativeWidth}`,
      top: `${top}${parent ? '%' : 'px'}`,
      left: `${left}${parent ? '%' : 'px'}`,
      pointerEvents: selectable ? 'unset' : 'none',
      zIndex: dragging ? 10000 : 'unset',
   }}>
    {children}
    <label className="shape-type-label">{shape.type}</label>
  </div>);
};

export const BoundingBox = Reactable(BoundingBoxComponent);
