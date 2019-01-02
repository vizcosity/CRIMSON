/**
 * Module handling functionality allowing users to tweak and modify the
 * abstract component representation generated for a source wireframe
 * passed.
 *
 * @ Aaron Baw 2018
 */

import React, { Component } from 'react';
import ResizeDetector from 'react-resize-detector';
import Reactable from 'reactablejs';
import InteractWrapper from 'react-interactjs-wrapper';
import interact from 'interactjs';



const BoundingBoxComponent = ({shape, parent, level, contains, getRef, children}) => {

var meta = shape.meta;
const origin = getUpperLeftmostVertex(meta.vertices);
const parentOrigin = getUpperLeftmostVertex(parent.meta.vertices);
var parentHeight = (parent ? parent.meta.absoluteHeight : 1);
var parentWidth = (parent ? parent.meta.absoluteWidth : 1);
var top = parent ? (((origin[1] - parentOrigin[1]) / (typeof parentHeight !== "string" ? parentHeight : 1)) * 100) : 0;
var left = parent ? (((origin[0] - parentOrigin[0]) / (typeof parentWidth !== "string" ? parentWidth : 1)) * 100) : 0;

console.log(shape.id, origin, parentHeight, parentWidth, left, top);

return (<div
ref={getRef}
className="bounding-box"
data-x={left}
data-y={top}
data-height={meta.relativeHeight}
data-width={meta.relativeWidth}
data-id={shape.id}
style={{
  height: `${meta.relativeHeight}`,
  width: `${meta.relativeWidth}`,
  top: `${top}${parent ? '%' : 'px'}`,
  left: `${left}${parent ? '%' : 'px'}`,
  // transform: `translateX(${meta.vertices[0][0]}px) translateY(${meta.vertices[0][1]}px)`
}}>
{children}
</div>)}
const BoundingBox = Reactable(BoundingBoxComponent);

class Toolbar extends Component {
  render(){
    return;
  }
}

class InteractiveACRModifier extends Component {

  constructor(props, context){
    super(props, context);
    this.imageRef = React.createRef();
    this.state = {
      canvasWidth: '100%',
      canvasHeight: '100%'
    };
    this.onResize = this.onResize.bind(this);
  }

  onResize(x, y){
    this.setState({
      canvasWidth: this.imageRef.width,
      canvasHeight: this.imageRef.height
    });

  }

  movePrimitive(primitive, {dx, dy, width, height}){

    moveACRObject(primitive, dx, dy);
    // Force a redraw.
    this.setState(this.state);
  }

  drawPrimitives(acr, parent = {
    meta: {
      absoluteWidth: this.state.canvasWidth,
      absoluteHeight: this.state.canvasHeight,
      vertices: [[0,0]]
    }
  }){

    if (!acr || acr.length === 0) return "";

    // We keep the acr object as a prop so that we do not have to call
    // setState when moving the primitive, as we would not be able to do
    // so by using a reference to some shape object.
    return acr.map((primitive, i) =>
      primitive.draw ? <BoundingBox
      parent={parent}
      children={this.drawPrimitives(primitive.contains, primitive)}
      shape={primitive}
      key={i}
      draggable
      onDragMove={({dx, dy}) => this.movePrimitive(primitive, {dx, dy, width:0, height:0})}
      {...primitive} /> : "")

  }

  render(){
    return (
      <div className="acr-mod-container">

        <div className="acr-image-container">

          <ResizeDetector handleWidth handleHeight onResize={this.onResize}>

          <div style={{
            width: this.state.canvasWidth,
            height: this.state.canvasHeight,
            position: 'absolute'
          }} className="acr-object-canvas">
          {
            /* Draw ACR Bounding boxes */
            this.drawPrimitives(this.props.project.acr)
          }

          </div>

          <img ref={ref => this.imageRef = ref} style={{
            width: '80%',
            height: 'auto'
          }}
          src={this.props.project.source.url} />

          </ResizeDetector>
        </div>

        <div style={{
          margin: '20px'
        }} className="acr-header-container">
          <h1>Editing {this.props.project.source.name}</h1>
          <p>
            Adjust the bounding boxes and shape primitive classification type
            before continuing.
          </p>
          </div>

      </div>
    );
  }

}

export default InteractiveACRModifier;

// Given an ACR object and a change in x, y, translates the object.
function moveACRObject(primitive, dx, dy){
  // Move all of the vertices & the midpoint.
  primitive.meta.vertices = primitive.meta.vertices.map(([x, y]) => [x+dx, y+dy]);
  primitive.meta.midpoint[0] += dx;
  primitive.meta.midpoint[1] += dy;
}

// Grabs the upperleftmost vertex.
function getUpperLeftmostVertex(vertices){
  console.log(vertices.sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1).sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1));
  return vertices.sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1).sort(([x1, y1], [x2, y2]) => x1 > x2 ? 1 : -1)[0]
}
