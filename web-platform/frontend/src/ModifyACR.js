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
import { Arrow } from './Icons.js';
import { getRelativeDistance, findACRObjectById, moveACRObject } from './geometry.js';
import { Link } from "react-router-dom";
import { Dropdown } from 'semantic-ui-react';


const BoundingBoxComponent = ({shape, parent, level, contains, getRef, children}) => {

var meta = shape.meta;

var {left, top} = getRelativeDistance(parent, shape);

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
<label className="shape-type-label">{shape.id}</label>
<label className="shape-type-label">{shape.type}</label>
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
      canvasHeight: '100%',
      modifyingPrimitive: null,
      doubleTap: {
        x: 0,
        y: 0
      }
    };
    this.panelWidth = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteWidth : 0;
    this.panelHeight = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteHeight : 0;
    this.sourceImageHeight = this.panelHeight !== 0 ? this.panelHeight / (parseFloat(this.props.project.acr[0].meta.relativeHeight) / 100) : 0;
    this.sourceImageWidth = this.panelWidth !== 0 ? this.panelWidth / (parseFloat(this.props.project.acr[0].meta.relativeWidth) / 100) : 0;
    this.onResize = this.onResize.bind(this);
    this.updateImageSizeProperties = this.updateImageSizeProperties.bind(this);
    this.initPrimitiveSelection = this.initPrimitiveSelection.bind(this);

  }

  componentDidMount(){
    this.updateImageSizeProperties();
  }

  updateImageSizeProperties(){
    this.setState({
      canvasWidth: this.imageRef.width,
      canvasHeight: this.imageRef.height,
      drawScaleFactor: {
        x: this.sourceImageWidth / this.imageRef.width,
        y: this.sourceImageHeight / this.imageRef.height
      }
    });

    // console.log(this.panelWidth);
    // console.log(this.imageRef.width);
    console.log(this.state.drawScaleFactor);
  }

  onResize(x, y){
    this.updateImageSizeProperties();
    // console.log(this.panelWidth);
    // console.log(`Draw scale factor X:`, this.state.drawScaleFactor.x, `Y:`, this.state.drawScaleFactor.y);
  }

  async initPrimitiveSelection(e, primitive){
    if (!this.availablePrimitives){
      // Fetch available primitives from the backend.
      var primitives = await fetch('/api/v1/getSupportedPrimitives').then(res => res.json());
      this.availablePrimitives = primitives.map(primitive => Object({
        text: primitive,
        value: primitive
      }));
    }

    this.setState({
      ...this.state,
      doubleTap: {
        x: e.x,
        y: e.y
      },
      modifyingPrimitive: primitive
    });

    // Prevent event from bubbling up div hierachy.
    e.stopPropagation();

    console.log(e, this.availablePrimitives);

  }

  endPrimitiveSelection(e, data){

    // Set the state to end primitive selection.
    this.setState({
      ...this.state,
      modifyingPrimitive: null
    });
  }

  movePrimitive({primitive, parent}, {dx, dy}){

    // console.log(this.state.drawScaleFactor);

    // Scale dx and dy by the width and height of the parent window.
    dx *= this.state.drawScaleFactor.x;
    dy *= this.state.drawScaleFactor.y;
    moveACRObject({primitive, parent}, dx, dy);
    // Force a redraw.
    this.setState(this.state);
  }

  // Nests the primitive within the new parent.
  nestWithinNewParent(primitive, oldParent, newParentDiv){

    // Find the newParent object given the id.
    var newParentId = newParentDiv.getAttribute('data-id');
    var newParent = findACRObjectById(this.props.project.acr, newParentId);

    console.log(`Found new parent`, newParent, `from id`, newParentId);

    console.log(`Removing`, primitive.id, `from`, oldParent.id);
    // Remove the primitive from the oldParent.
    oldParent.contains = oldParent.contains.filter(shape => shape.id !== primitive.id);

    // Add the primitive to the new parent.
    newParent.contains.push(primitive);

    // Force a redraw so that the div is now placed inside the parent.
    this.setState(this.state);


  }

  drawPrimitives(acr, parent = {
    meta: {
      absoluteWidth: this.state.canvasWidth,
      absoluteHeight: this.state.canvasHeight,
      vertices: [[0,0]]
    },
    id: "canvas",
    contains: []
  }){
    if (!acr || acr.length === 0) return "";

    // We keep the acr object as a prop so that we do not have to call
    // setState when moving the primitive, as we would not be able to do
    // so by using a reference to some shape object.
    return acr.map((primitive, i) =>
      primitive.draw ? <BoundingBox
      parent={parent}
      shape={primitive}
      children={this.drawPrimitives(primitive.contains, primitive)}
      key={i}
      draggable
      dropzone={{
        ondropactivate: event => {
          event.target.classList.add('drop-active')
        },
        ondropdeactivate: event => {
          event.target.classList.remove('drop-active')
        },

        // ondrop: event => this.nestWithinNewParent(primitive, parent, event.relatedTarget)
      }}
      onDragMove={({dx, dy}) => this.movePrimitive({primitive, parent}, {dx, dy, width:0, height:0})}
      onDoubleTap={e => this.initPrimitiveSelection(e, primitive)}
      {...primitive} /> : "")

  }

  render(){
    return (
      <div className="acr-mod-container">

        <div className="acr-image-container">

          {
            /* Display dropdown on double click. */
            this.state.modifyingPrimitive ?
            <Dropdown
              style={{
                position: 'absolute',
                zIndex: 10,
                width: '200px',
                top: this.state.doubleTap.y,
                left: this.state.doubleTap.x
              }}
              fluid selection compact open
              onChange={(e, val) => this.endPrimitiveSelection(e, val)}
              defaultValue={this.state.modifyingPrimitive.type}
              options={this.availablePrimitives}
              />
            : ""
          }

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
            width: 'unset',
            height: '-webkit-fill-available'
          }}
          src={this.props.project.source.url} />

          </ResizeDetector>
        </div>

        <div className="acr-right-panel">

        <div className="acr-header-container">
          <h1>Editing {this.props.project.source.name}</h1>
          <p>
            Adjust the bounding boxes and shape primitive classification type
            before continuing.
          </p>
        </div>

        <div className="continue-container">
          <Link className="continue-button" style={{
            // display: 'flex',
            // flexDirection: 'column',
            // justifyContent: 'center',
            // alignItems: 'center'
            // marginLeft: 'auto',
            // marginRight: '20px'
          }} to="/generate-code">Continue</Link>
          <Arrow style={{
            marginTop: '5px',
            marginLeft: '10px'
          }} />
        </div>

        </div>

      </div>
    );
  }

}

export default InteractiveACRModifier;
