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
import EditDialogue from './CustomisePrimitive';
import { ArrowIcon, GenerateCodeIcon, CloseIcon, InfoButtonIcon } from './Icons';
import { OverlayButton } from './Asset';
import * as Icon from './Icons';
import Toolbar from './Toolbar';
// import Primitive from './Primitive.js';
import { Container, ACRObject } from 'crimson-inference/modules/ACR.js';
import {
  getRelativeDistance,
  findACRObjectById,
  moveACRObject,
  resizeACRObject,
  IDGenerator
} from './geometry.js';
import _ from 'lodash';
import { Link } from "react-router-dom";
import { Dropdown } from 'semantic-ui-react';

// Import styles.
import './Styles/ModifyACR.css';

const BoundingBoxComponent = ({
  shape,
  className,
  parent,
  level,
  contains,
  getRef,
  selectable = true,
  children
}) => {

var meta = shape.meta;

var {left, top} = getRelativeDistance(parent, shape);

return (<div
ref={getRef}
className={"bounding-box " + className}
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
  pointerEvents: selectable ? 'unset' : 'none'
  // transform: `translateX(${meta.vertices[0][0]}px) translateY(${meta.vertices[0][1]}px)`
}}>
{children}
<label className="shape-type-label">{shape.type}</label>
</div>)}
const BoundingBox = Reactable(BoundingBoxComponent);

class InteractiveACRModifier extends Component {

  constructor(props, context){

    super(props, context);
    this.imageRef = React.createRef();
    this.state = {
      canvasWidth: '100%',
      canvasHeight: '100%',
      selectedPrimitive: null,
      drawScaleFactor: {
        x: 1,
        y: 1,
      },
      doubleTap: {
        x: 0,
        y: 0
      },
      // The interaction mode specifies how the user is currently interacting with
      // the canvas.
      // 'select' allows the user to select and move primitives.
      // 'add' allows users to create new primitives.
      interactionMode: "select"
    };


    // Perform some pre-processing on the ACR. Top level shapes should have a
    // parent of 'none'.
    log(`Instantiating ACR Modifier with project:`, this.props.project);
    this.props.project.acr.forEach(object => object.parentId = "None");

    this.panelWidth = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteWidth : 0;
    this.panelHeight = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteHeight : 0;
    this.sourceImageHeight = this.panelHeight !== 0 ? this.panelHeight / (parseFloat(this.props.project.acr[0].meta.relativeHeight) / 100) : 0;
    this.sourceImageWidth = this.panelWidth !== 0 ? this.panelWidth / (parseFloat(this.props.project.acr[0].meta.relativeWidth) / 100) : 0;
    this.onResize = this.onResize.bind(this);
    this.updateImageSizeProperties = this.updateImageSizeProperties.bind(this);
    this.initPrimitiveSelection = this.initPrimitiveSelection.bind(this);

    // Toolbar handlers: Navigation.
    this.generateCodeHandler = this.generateCodeHandler.bind(this);
    this.goBackHandler = this.goBackHandler.bind(this);

    // Toolbar handlers: Modification.
    this.duplicatePrimitiveHandler = this.duplicatePrimitiveHandler.bind(this);

    // Register key listener for deleting primitives.
    document.addEventListener('keyup', (e) => e.keyCode === 8 && this.removeSelectedPrimitive());

    // Instantiate the ID generator.
    this.idGenerator = new IDGenerator(this.props.project.acr);


  }

  componentDidMount(){
    this.updateImageSizeProperties();
    this.setState({
      ready: true
    })
  }

  // A wrapper function which finds ACR objects by their id, and performs some
  // safety checks in case the intended object to be found is the canvas object.
  findACRObjectById(id){

    // Check if id is none; return the implicit parent canvas element.
    if (!id) return this.implicitCanvasACRObject;

    var parent = findACRObjectById(this.props.project.acr, id);

    return parent || this.implicitCanvasACRObject;
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

    // Update implicit canvasACR element which will simply be used as the
    // top level ACR object. It contains no useful information and is simply
    // used to support functions which require the use of a parent acr object,
    // on objects such as panels which are natively the top level elements of the
    // ACR representation.
    this.implicitCanvasACRObject = {
      meta: {
        absoluteWidth: this.imageRef.width * this.state.drawScaleFactor.x,
        absoluteHeight: this.imageRef.height * this.state.drawScaleFactor.y,
        vertices: [[0,0]]
      },
      id: "canvas",
      contains: []
    };

  }

  onResize(x, y){
    this.updateImageSizeProperties();
  }

  // Creates a new container primitive and adds to the ACR.
  createPrimitive(parent, {x, y}){

    x *= this.state.drawScaleFactor.x;
    y *= this.state.drawScaleFactor.y;

    var newPrimitive = new Container({
      id: this.idGenerator.newId(),
      parent: parent,
      midpoint: [x, y],
      width: parent.meta.absoluteWidth / 2,
      height: parent.meta.absoluteHeight / 2,
      level: parent.level + 1
    })
    parent.contains.push(newPrimitive);
  }

  removeSelectedPrimitive(){
    if (!this.state.selectedPrimitive) return;

    var parent = findACRObjectById(this.props.project.acr, this.state.selectedPrimitive.parentId);

    if (parent) parent.contains = parent.contains.filter(s => s.id !== this.state.selectedPrimitive.id);

    // Clear selected primitive.
    this.clearSelectedPrimitive();
  }

  selectPrimitive(primitive, changingType = false){
    this.setState({
      ...this.state,
      selectedPrimitive: primitive,
      changingType
    })
  }

  clearSelectedPrimitive(){
    this.setState({
      ...this.state,
      selectedPrimitive: null
    })
  }

  // TEMP: Attempt to address desync between primitive clicked on, and the one
  // that the internal state believes is selected.
  async initPrimitiveSelection(e, primitive){

    if (!this.availablePrimitives){
      // Fetch available primitives from the backend.
      var primitives = await fetch('/api/v1/getSupportedPrimitives').then(res => res.json());
      this.availablePrimitives = primitives.map(primitive => Object({
        text: primitive,
        value: primitive,
        icon: Icon[`${primitive[0].toUpperCase()+primitive.substring(1, primitive.length)+'Icon'}`]
      }));
    }

    console.log(`MODIFY ACR | Available primitives`, this.availablePrimitives);

    this.setState({
      ...this.state,
      doubleTap: {
        x: e.x,
        y: e.y
      },
      modifyingPrimitive: primitive
    });

    // Select the current primitive, and set 'changingType' to true.
    // this.selectPrimitive(primitive, true);

    // Prevent event from bubbling up div hierachy.
    e.stopPropagation();

  }

  setPrimitiveType(type){

    // Change the type of the modifying primitive. We are not changing the state
    // so much as a reference to an object contained within the state, so
    // warnings about mutation of the state can safely be ignored.
    this.state.modifyingPrimitive.type = type;

    this.setState(this.state);

  }

  endPrimitiveSelection(){
    // Set the state to end primitive selection.
    this.setState({
      ...this.state,
      modifyingPrimitive: null
    });
  }

  resizePrimitive(primitive, parent, height, width){
    if (parent.id !== "canvas") height *= this.state.drawScaleFactor.y;
    if (parent.id !== "canvas") width *= this.state.drawScaleFactor.x;

    log(`Resizing ${primitive.id} to`, height, width);

    resizeACRObject(primitive, parent, height, width);
    // Redraw.
    this.setState(this.state);
  }

  movePrimitive({primitive, parent}, {dx, dy}){

    // Select the current primitive.

    // Scale dx and dy by the width and height of the parent window.
    dx *= this.state.drawScaleFactor.x;
    dy *= this.state.drawScaleFactor.y;

    // console.log(`Moving ${primitive.id} by`, dx, dy);

    moveACRObject({primitive, parent}, dx, dy);
    // Force a redraw.
    this.setState(this.state);
  }

  // Nests the primitive within the new parent.
  nestWithinNewParent(primitiveDiv, newParentDiv){

    // Find the newParent, primitive, and oldParent object given the id.
    var primitiveId = primitiveDiv.getAttribute('data-id');
    var primitive = this.findACRObjectById(primitiveId);
    var newParentId = newParentDiv.getAttribute('data-id');
    var newParent = this.findACRObjectById(newParentId);
    var oldParent = this.findACRObjectById(primitive.parentId);

    // Prevent shapes from being nested within themselves or from being added
    // to shapes which they are already nested within.
    if (primitive.id === newParent.id) return;
    if (newParent.contains.map(s => s.id).indexOf(primitive.id) !== -1) return;

    // If oldParent is null, we are likely trying to nest a panel.
    // Remove the primitive from the oldParent.
    if (oldParent)
      oldParent.contains = oldParent.contains.filter(shape => shape.id !== primitive.id);

    // Set the primitive's new parent.
    primitive.parentId = newParent.id;

    // Add the primitive to the new parent.
    newParent.contains.push(primitive);

    // Force a redraw so that the div is now placed inside the parent.
    this.setState(this.state);


  }

  drawPrimitives(acr,
    // By default, if there is no parent, then this must be the highest level
    // primitive - in which case we create a 'pseudo' primitive which will
    // contain it - the canvas.
    parent={
          meta: {
            absoluteWidth: this.imageRef.width * this.state.drawScaleFactor.x,
            absoluteHeight: this.imageRef.height * this.state.drawScaleFactor.y,
            vertices: [[0,0]]
          },
          id: "canvas",
          contains: []
    })
  {
    if (!acr || acr.length === 0) return "";

    // We keep the acr object as a prop so that we do not have to call
    // setState when moving the primitive, as we would not be able to do
    // so by using a reference to some shape object.
    return acr.map((primitive, i) =>
      primitive.draw ? <BoundingBox
      className={this.state.selectedPrimitive && (this.state.selectedPrimitive.id == primitive.id) ? 'selected' : ''}
      parent={parent}
      shape={primitive}
      children={this.drawPrimitives(primitive.contains, primitive)}
      key={i}
      selectable={this.state.interactionMode === "select"}
      dropzone={{
        ondropactivate: event => {
          event.target.classList.add('drop-active')
          // console.log(primitive.id, `is active for dropping.`);
        },
        ondropdeactivate: event => {
          event.target.classList.remove('drop-active');
          // console.log(primitive.id, `no longer active for dropping.`);
        },

        ondrop: event => {
          // console.log(`Dropping`, event.relatedTarget, `Into`, event.target, `This Primitive: `,primitive.id, `This Primitive Parent:`, parent.id);
          this.nestWithinNewParent(event.relatedTarget, event.target)
        }
      }}
      onDragMove={
        ({target, dx, dy}) => {
          var primitive = this.findACRObjectById(target.dataset.id);
          var parent = this.findACRObjectById(primitive.parentId);
          this.movePrimitive({
            primitive: primitive,
            parent: parent
          }, {dx, dy, width:0, height:0})
        }
      }
      // Ensure that the object is only interactable when the user is in selection
      // mode.
      draggable
      resizable={{
        margin: 5,
        edges: {
          top: true,
          right: true,
          bottom: true,
          left: true
        }
      }}
      onDoubleTap={e =>
        e.stopPropagation() ||
        this.initPrimitiveSelection(e, this.findACRObjectById(e.currentTarget.dataset.id))
      }
      onUp={e =>
        e.stopPropagation() ||
        this.selectPrimitive(this.findACRObjectById(e.currentTarget.dataset.id))
      }
      // onHold={e => e.stopPropagation() || this.createPrimitive(this.findACRObjectById(e.currentTarget.dataset.id), {x: e.x, y: e.y})}
      onResizeMove={
        e => {
          e.stopPropagation();
          var primitive = this.findACRObjectById(e.currentTarget.dataset.id);
          var parent = this.findACRObjectById(primitive.parentId);
          console.log(primitive, parent)
          this.resizePrimitive(primitive, parent, e.rect.width, e.rect.height);
          this.movePrimitive({primitive, parent}, {
            dx: e.deltaRect.left,
            dy: e.deltaRect.top
          });
        }
      }
      {...primitive} /> : "")

  }

  // Toolbar handlers: Navigation.
  generateCodeHandler(){
    if (this.props.history) this.props.history.push('/generate-code');
  }

  goBackHandler(){
    if (this.props.history) this.props.history.push('/');
  }

  // Toolbar handlers: Modification.
  duplicatePrimitiveHandler(){

    // Retrieve the selected primitive. If no primitive is selected, display an
    // error message to the user.
    if (!this.state.selectedPrimitive)
      return this.displayError("No primitive selected.");

    log(`Duplicating`, this.state.selectedPrimitive);

    // Attempt to fetch the current primitive's parent.
    // If we cannot locate a parent primitive, then we return the implicit ACR
    // object from which we will add the new object to as a new child.
    let parentPrimitive = this.findACRObjectById(this.state.selectedPrimitive.parentId);


    // Ensure that we create a new ACR object from a *copy* of the selected primitive.
    // This is required since Object.assign copies the reference of the source
    // object onto the target object.
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    let duplicated =
      ACRObject
      .fromJSON(_.cloneDeep(this.state.selectedPrimitive))
      .displaced({x: 3, y: 3});

    duplicated.id = this.idGenerator.newId();
    parentPrimitive.contains.push(duplicated);

    this.setState(this.state);

  }

  // Error handling.
  displayError(message){
    log(`[Temp Error Display]:`, message);
  }

  render(){
    return (
      <div className="acr-mod-container">
        <Toolbar
          generateCodeHandler={this.generateCodeHandler}
          goBackHandler={this.goBackHandler}

          // Primitive modification handlers (selection, creation, duplication).
          duplicatePrimitiveHandler={this.duplicatePrimitiveHandler}

          // Interaction mode handlers.
          selectButtonHandler={() => this.setState({...this.state, interactionMode: "select"})}
          addPrimitiveHandler={() => this.setState({...this.state, interactionMode: "add"})}

        />
        <div
          className="acr-image-container"
          style={{
            width: '100%',
            height: '100%'
          }}
        >

          {
            /* Display dropdown on double click. */
            (this.state.modifyingPrimitive) ?
            <EditDialogue
              x={this.state.doubleTap.x}
              y={this.state.doubleTap.y}
              primitive={this.state.modifyingPrimitive}
              onChangePrimitiveType={type => this.setPrimitiveType(type)}
              onClose={() => this.endPrimitiveSelection()}
              primitiveTypes={this.availablePrimitives} />

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
            this.state.ready ? this.drawPrimitives(this.props.project.acr) : ""
          }

          </div>

          <img ref={ref => this.imageRef = ref} style={{
            width: 'auto',
            // height: '-webkit-fill-available',
            maxHeight: '100%'
          }}
          src={this.props.project.source.data} />

          </ResizeDetector>
        </div>
      </div>
    );
  }

}

export default InteractiveACRModifier;

// Logging
function log(...msg){
  console.log(`MODIFY ACR |`, ...msg);
}
