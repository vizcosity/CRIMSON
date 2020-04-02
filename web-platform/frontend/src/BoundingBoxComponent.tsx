import React from 'react';
import Reactable from 'reactablejs';
import { getRelativeDistance } from './geometry';

const BoundingBoxComponent = ({ 
  shape, 
  className,
  dragging,
  parent, 
  level, 
  contains,
  getRef, 
  selectable = true, 
  children
}) => {
  var meta = shape.meta;

  let [left, top] = parent ? getRelativeDistance(parent, shape) : shape.meta.initialVertices[0];
  return (<div 
    ref={getRef} 
    className={"bounding-box " + className} 
    data-x={`${left}`} data-y={`${top}`} 
    data-height={meta.relativeHeight} 
    data-width={meta.relativeWidth} 
    data-id={shape.id} 
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
