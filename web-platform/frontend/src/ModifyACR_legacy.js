/**
 * Module handling functionality allowing users to tweak and modify the
 * abstract component representation generated for a source wireframe
 * passed.
 *
 * @ Aaron Baw 2018
 */

import React, { Component } from 'react';
import ResizeDetector from 'react-resize-detector';
import EditDialogue from './CustomisePrimitive';
import * as Icon from './Icons';
import Toolbar from './Toolbar';
import { BoundingBox } from './BoundingBoxComponent';
import { Container, ACRObject } from 'crimson-inference/modules/ACR';
import {
  findACRObjectById,
  moveACRObject,
  resizeACRObject,
  convertGlobalToBoundingBoxCoordinates,
  IDGenerator,
  // convertAbsoluteToRelativeCoordinates
} from './geometry';
import _ from 'lodash';

// Import styles.
import './Styles/ModifyACR.css';

class InteractiveACRModifier extends Component {

  constructor(props, context){

    super(props, context);
    this.imageRef = React.createRef();
    this.state = {
      canvasWidth: '100%',
      canvasHeight: '100%',
      selectedPrimitive: null,
      // Corresponds to the primitive which is currently being created (via
      // dragging) by the user.
      creatingPrimitive: null,
      // The parent of the current primitive being created. This is stored as a
      // reference so that we do not have to continuously search the contains hierarchy
      // everytime the mouseMove event is fired.
      creatingPrimitiveParent: null,
      drawScaleFactor: {
        x: 1,
        y: 1,
      },
      doubleTap: {
        x: 0,
        y: 0
      },

      // The absolute mouse coordinates.
      absoluteMouseX: 0,
      absoluteMouseY: 0,
      
      // The mouse coordinates with respect to the canvas. This is used for the creation of 
      // new primitives, as well as re-sizing.
      canvasMouseX: 0,
      canvasMouseY: 0,

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
    this.generateBoundingBox = this.generateBoundingBox.bind(this);

    // Toolbar handlers: Navigation.
    this.generateCodeHandler = this.generateCodeHandler.bind(this);
    this.goBackHandler = this.goBackHandler.bind(this);

    // Toolbar handlers: Modification.
    this.duplicatePrimitiveHandler = this.duplicatePrimitiveHandler.bind(this);
    // :Interaction
    this.changeInteractionModeHandler = this.changeInteractionModeHandler.bind(this);
    // :Adding primitives and canvas click handling.
    this.canvasMouseDownHandler = this.canvasMouseDownHandler.bind(this);
    this.canvasMouseUpHandler = this.canvasMouseUpHandler.bind(this);
    this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this);

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
    this.implicitCanvasACRObject = ACRObject.fromJSON({
      meta: {
        absoluteWidth: this.imageRef.width * this.state.drawScaleFactor.x,
        absoluteHeight: this.imageRef.height * this.state.drawScaleFactor.y,
        vertices: [[0,0]]
      },
      id: "canvas",
      contains: []
    });

  }

  onResize(x, y){
    this.updateImageSizeProperties();
  }

  // Handles creation of new ACR objects if the user is in 'add' mode.
  // TODO: Fix positioning of drawn container
  // TODO: Ensure that we can drag above and to the left of the initial click point
  canvasMouseDownHandler(e){


    // If there is already a primitive being created, ignore the mouse down
    // handler.
    if (this.state.creatingPrimitve) return;
    if (this.state.interactionMode !== "add") return;

    // let creatingPrimitive = this.createPrimitive(null, {
    //   left: absCords[0],
    //   top: absCords[1],
    //   height: 1,
    //   width: 1
    // });

    // Create a new container primitive at the base level, using the absolute
    // mouse coordinates. We save the parent primitive id so that we can add
    // the newly created primitive to the parent once we release the mouse
    // button.
    let creatingPrimitive = new Container({
      id: this.idGenerator.newId(),
      left: this.state.canvasMouseX,
      top: this.state.canvasMouseY,
      width:  0,
      height: 0,
      level: 0,
      //parent: this.implicitCanvasACRObject
    });
    
    let creatingPrimitiveParent = this.state.selectedPrimitive || this.implicitCanvasACRObject;

    log('Created Primitive:', creatingPrimitive, `with parent:`, creatingPrimitiveParent);


    // Update the state to contain the newly created primitive as the one being defined.
    this.setState({...this.state, creatingPrimitive, creatingPrimitiveParent})

  }

  // Handles releasing the mouse button - ensuring that the creating primitive
  // and the creating primitive parent are released. Adds the creatingPrimitive to the 
  // creatingPrimitiveParent's component hierarchy.
  canvasMouseUpHandler(e){

    if (!this.state.creatingPrimitive) return;

    // If no creatingPrimitiveParent has been set, then the primitive is being created on the canvas, 
    // in which case we should use the implicitCanvasACRObject.
    let creatingPrimitiveParent = this.state.creatingPrimitiveParent
    if (!creatingPrimitiveParent){
      creatingPrimitiveParent = this.implicitCanvasACRObject
      this.setState({
        ...this.state,
        creatingPrimitiveParent
      });
    }

    log(`Adding`, this.state.creatingPrimitive, `to`, creatingPrimitiveParent);

    creatingPrimitiveParent.addContainingShape(this.state.creatingPrimitive);
    
    log(`Added`, this.state.creatingPrimitive, `to`, creatingPrimitiveParent);

    this.setState({
      ...this.state,
      creatingPrimitive: null,
      creatingPrimitiveParent: null
    });


  }

  // Handles drag-to-create new primitive.
  canvasMouseMoveHandler(e){

    // Create a new ACR object at the current mouse position, and auto-drag on the
    // corner of the shape until the mouse is released. We need to add it
    // to the current shape being clicked on.
    let [absoluteMouseX, absoluteMouseY] = [e.pageX, e.pageY];
    let canvasCords = [this.canvasRef.offsetLeft, this.canvasRef.offsetTop];

    // Update left and top so that the coordinates are given with respect to the bounding
    // box.
    let canvasSize = { 
      height: this.canvasRef.offsetHeight, 
      width: this.canvasRef.offsetWidth 
    };

    // Convert the mouse object into relative coordinates of the object canvas (
    // or perhaps of the bounding box we have selected).
    let [canvasMouseX, canvasMouseY] = convertGlobalToBoundingBoxCoordinates(
      [absoluteMouseX, absoluteMouseY], 
      canvasCords, 
      canvasSize
    );

    // log(`Converted global coordinates`, globalCoords, `to bounding-box coordinates:`, [left, top]);


    // Set the absolute and canvas mouse position coordinates for the state.
    this.setState({
      ...this.state,
      absoluteMouseX,
      absoluteMouseY,
      canvasMouseX,
      canvasMouseY
    })

    // Ensure we exit early if the user is not in 'add' mode, or the creatingPrimitve
    // has not yet been created.
    if (this.state.interactionMode !== "add"
      || !this.state.creatingPrimitive
      || !this.state.creatingPrimitiveParent
    ) return;

    // Fetch the initial left and top values for the primitive.
    // We no longer use nativeEvent.offSet[x/y] as this continuously gets reset
    // as the mouse hovers over other objects which also have mouse handlers, causing
    // the creating primitive to needlessly jump around.
    let [initialLeft, initialTop] = this.state.creatingPrimitive.meta.initialVertices[0];

    // let height = e.nativeEvent.offsetY;
    // let width = e.nativeEvent.offsetX;

    // We need to ensure that we are also converting the absolute mouse coordinates to relative 
    // canvas coordinates at this point, to ensure that the corner of the object remains beneath 
    // the mouse.
    let [mouseX, mouseY] = [e.pageX, e.pageY];
    let boundingBoxCords = [this.canvasRef.offsetLeft, this.canvasRef.offsetTop];
    let boundingBoxSize = { height: this.canvasRef.offsetHeight, width: this.canvasRef.offsetWidth };

    // Convert the mouse object into relative coordinates of the object canvas (
    // or perhaps of the bounding box we have selected).
    let [canvasX, canvasY] = convertGlobalToBoundingBoxCoordinates([mouseX, mouseY], boundingBoxCords, boundingBoxSize);

    log(`Canvas X & Y for mouse position while dragging:`, canvasX, canvasY);

    let height = canvasY - initialTop;
    let width = canvasX - initialLeft;

    console.log(`Creating Primitive height:`, height, `width:`, width);

    // console.log(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    // this.resizePrimitive(
    //   this.state.creatingPrimitive,
    //   this.findACRObjectById(null),
    //   // e.pageY - this.state.creatingPrimitive.meta.vertices[0][1],
    //   // e.pageX - this.state.creatingPrimitive.meta.vertices[0][0],
    //   width,
    //   height
    // );

    //Checkpint: consider drawsaleactor.
    resizeACRObject(this.state.creatingPrimitive, null, width, height);

    // Redraw.
    this.setState(this.state);

  }

  // Creates a new container primitive and adds to the ACR, returning the
  // instance of the primitive created.
  // If there is no parent passed, then we assume that we are creating a root
  // level primitive.
  createPrimitive(parent, {
    midX,
    midY,
    left,
    top,
    width = 5,
    height = 5
  }){

    if (midX) midX *= this.state.drawScaleFactor.x;
    if (midY) midY *= this.state.drawScaleFactor.y;
    if (left) left *= this.state.drawScaleFactor.x;
    if (top) top *= this.state.drawScaleFactor.y;


    var newPrimitive = new Container({
      id: this.idGenerator.newId(),
      parent: parent,
      midpoint: midX && midY ? [midX, midY] : null,
      left,
      top,
      width:  parent ? parent.meta.absoluteWidth / 2 : width,
      height: parent ? parent.meta.absoluteHeight / 2 : height,
      level: parent ? parent.level + 1 : 0
    });
    if (parent) parent.contains.push(newPrimitive);
    // else this.props.project.acr[0].contains.push(newPrimitive);
    else this.props.project.acr.push(newPrimitive);


    // Returns an instance of the primitive.
    return newPrimitive;

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
    }, () => log(`Selected primitive is now ${this.state.selectedPrimitive.id}`, this.state.selectedPrimitive));
  }

  clearSelectedPrimitive(){
    this.setState({
      ...this.state,
      selectedPrimitive: null
    });
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
    // eslint-disable-next-line
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

  resizePrimitive(primitive, parent, width, height){

    if (parent.id !== "canvas") width *= this.state.drawScaleFactor.y;
    if (parent.id !== "canvas") height *= this.state.drawScaleFactor.x;

    log(`Resizing ${primitive.id} to`, width, height);

    resizeACRObject(primitive, parent, width, height);
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

    // Prevent parents from being nested within their own children, as this will
    // cause a circular reference. Checks to see if the selected primitive is
    // contained somewhere in the contains tree for the prospective parent.
    // If the current primitive contains the prospective parent, this means we
    // need to prevent the selected primitive from being nested within the parent.
    // This is typically caused by mouse movements being faster than animation -
    // enabling the case where the mouse can allow some selected primitive to
    // theoretically be released into one of its children - by 'getting ahead' of
    // the animation.
    //
    // If we can find the newParentId from the selected primitive, this means
    // that we are attempting to nest the current primitive within its own
    // contains hierarchy.
    if (findACRObjectById(primitive.contains, newParentId)) return log(`Prevented circular reference.`);

    // If oldParent is null, we are likely trying to nest a panel.
    // Remove the primitive from the oldParent.
    if (oldParent)
      oldParent.contains = oldParent.contains.filter(shape => shape.id !== primitive.id);

    // Set the primitive's new parent.
    primitive.parentId = newParent.id;

    console.log(`Nesting`, primitiveId, `within`, newParentId);

    // Add the primitive to the new parent.
    // newParent.contains.push(primitive);
    newParent.addContainingShape(primitive);

    // Force a redraw so that the div is now placed inside the parent.
    this.setState(this.state);


  }

  // Generates a bounding box component for the given primitive.
  generateBoundingBox({primitive, parent, i}){
    return (<BoundingBox
    className={
      this.state.selectedPrimitive && (this.state.selectedPrimitive.id === primitive.id) ? 'selected' : ''
    }
    dragging={
      this.state.selectedPrimitive &&
      this.state.selectedPrimitive.dragging &&
      this.state.selectedPrimitive.id === primitive.id
    }
    parent={parent}
    shape={primitive}
    children={this.drawPrimitives(primitive.contains, primitive)}
    key={i}
    //selectable={this.state.interactionMode === "select"}
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
        this.nestWithinNewParent(event.relatedTarget, event.target)
      }
    }}
    // Ensure that the object is only interactable when the user is in selection
    // mode.
    draggable={this.state.interactionMode === "select"}
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
      e.stopPropagation() || e.preventDefault() ||
      // this.initPrimitiveSelection(e, this.findACRObjectById(e.currentTarget.dataset.id))
      this.initPrimitiveSelection(e, primitive)
    }
    onDown={e => {
        // We need to ensure that the event propagates so that we capture the mouse movement
        // used to create new primitives.
        // e.stopPropagation() || e.preventDefault() ||
        // Ensure that we prevent selection of a new primitive while we are in the
        // middle of creating a new one, as this will cause a new state update and
        // change the prospective parent of the primitive.
        if (this.state.creatingPrimitiveParent) return;
        if (this.state.interactionMode !== "add") {
          console.log(`Preventing propagation`);
          e.preventDefault();
          e.stopPropagation();
        }

        // TEMP: Select primitive using the object used to construct the bounding box, 
        // rather than trying to find the primitive by using the ID attached to the div's 
        // data-id property.
        this.selectPrimitive(primitive);
        // this.selectPrimitive(this.findACRObjectById(e.currentTarget.dataset.id))
      }
    }
    // Ensure that the primitive is visible on top of all other primitives.
    onDragStart={() => this.setState({...this.state, selectedPrimitive: {...this.state.selectedPrimitive, dragging: true}})}
    onDragEnd={() => this.setState({...this.state, selectedPrimitive: {...this.state.selectedPrimitive, dragging: false}})}
    onDragMove={
      (e) => {
        let {dx, dy} = e;
        // If we are not in selection mode, then we should return before the
        // primitive location is altered.
        if (this.state.interactionMode !== "select") return;
        // var primitive = this.findACRObjectById(target.dataset.id);
        var parent = this.findACRObjectById(primitive.parentId);
        this.movePrimitive({
          primitive: primitive,
          parent: parent
        }, {dx, dy, width:0, height:0});
        e.preventDefault();
      }
    }
    onHold={
      e => {
        e.stopPropagation();
       this.createPrimitive(this.findACRObjectById(e.currentTarget.dataset.id), {left: this.state.canvasMouseX, top: this.state.canvasMouseY})
      }
    }
    onResizeMove={
      e => {
        if (this.state.interactionMode !== "select") return;
        e.stopPropagation();
        // var primitive = this.findACRObjectById(e.currentTarget.dataset.id);
        var parent = this.findACRObjectById(primitive.parentId);
        this.resizePrimitive(primitive, parent, e.rect.width, e.rect.height);
        this.movePrimitive({primitive, parent}, {
          dx: e.deltaRect.left,
          dy: e.deltaRect.top
        });
        e.preventDefault();
      }
    }
    {...primitive} />);
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
      primitive.draw ? this.generateBoundingBox({primitive, parent, i}) : "")

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

  changeInteractionModeHandler(interactionMode){
    // Clear the selected primitive, creating primitive(s) and set the interaction mode.
    this.setState({
      ...this.state,
      selectedPrimitive: null,
      creatingPrimitve: null,
      creatingPrimitiveParent: null,
      interactionMode
    });
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
          selectButtonHandler={() => this.changeInteractionModeHandler("select")}
          addPrimitiveHandler={() => this.changeInteractionModeHandler("add")}
          absoluteMouse={{x: this.state.absoluteMouseX, y: this.state.absoluteMouseY}}
          canvasMouse={{x: this.state.canvasMouseX, y: this.state.canvasMouseY}}
          debugMode={this.props.debugMode}
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

          <div
            style={{
              width: this.state.canvasWidth,
              height: this.state.canvasHeight,
              position: 'absolute',
              cursor: this.state.interactionMode === 'add' ? 'crosshair' : 'unset'
            }}
            className="acr-object-canvas"
            onMouseDown={this.canvasMouseDownHandler}
            onMouseMove={this.canvasMouseMoveHandler}
            onMouseUp={this.canvasMouseUpHandler}
            ref={ref => this.canvasRef = ref}
          >

          {
            /* Draw the expected position of the new primitive before creating when in 'add' mode */
            this.props.debugMode
            && this.state.interactionMode === "add" 
            && this.state.canvasMouseX 
            && this.state.canvasMouseY ? 
            <div className="add-primitive-cursor-canvas-cord-preview" style={{
              position: 'absolute',
              left: this.state.canvasMouseX - 2.5,
              top: this.state.canvasMouseY - 2.5,
              width: '5px',
              height: '5px',
              backgroundColor: 'black',
              borderRadius: '100%'
            }}></div> : ""
          }

          {
            /* Draw the expected position of the new primitive before creating when in 'add' mode, if 
            the absolute mouse coordinate were to be used. */
            this.props.debugMode 
            && this.state.interactionMode === "add" 
            && this.state.absoluteMouseX 
            && this.state.absoluteMouseY ? 
            <div className="add-primitive-cursor-absolute-cord-preview" style={{
              position: 'absolute',
              left: this.state.absoluteMouseX - 2.5,
              top: this.state.absoluteMouseY - 2.5,
              width: '5px',
              height: '5px',
              backgroundColor: 'blue',
              borderRadius: '100%'
            }}></div> : ""
          }

          {
            /* Draw ACR Bounding boxes */
            this.state.ready ? this.drawPrimitives(this.props.project.acr) : ""
          }

          {
            /* Draw the creating primitive if there is one. */
            this.state.creatingPrimitive ?
            // "SAMPLE": ""
            this.generateBoundingBox({
              // parent: this.implicitCanvasACRObject,
              primitive: this.state.creatingPrimitive
            })
            : ""
          }

          </div>

          <img alt="Background Canvas" ref={ref => this.imageRef = ref} style={{
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
