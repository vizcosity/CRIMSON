/**
 * Module handling functionality allowing users to tweak and modify the
 * abstract component representation generated for a source wireframe
 * passed.
 *
 * @ Aaron Baw 2018
 */

import React, { Component, ElementRef, RefObject } from 'react';
import { fetchAvailablePrimitives } from './Fetch';
import ResizeDetector from 'react-resize-detector';
import EditDialogue from './CustomisePrimitive';
import * as Icon from './Icons';
import Toolbar from './Toolbar';
import { InteractionMode } from './data/constants';
import { BoundingBox } from './BoundingBoxComponent';
import { Container, ACRObject } from 'crimson-inference/modules/ACR';
import {
  findACRObjectById,
  moveACRObject,
  resizeACRObject,
  convertGlobalToBoundingBoxCoordinates,
  IDGenerator,
  Size, 
  Point
  // convertAbsoluteToRelativeCoordinates
} from 'crimson-inference/modules/geometry';
import _ from 'lodash';

// Import styles.
import './Styles/ModifyACR.css';
import { EventEmitter } from 'events';

type ACRProject = {
  acr: ACRObject[],
  source: {
    name: string,
    data: string
  }
};

type InteractiveACRModifierProps = {
  project: ACRProject,
  history: string[],
  debugMode: boolean
};

type InteractiveACRModifierState = {
  canvasSize: Size,

  availablePrimitives: Object[],

  selectedPrimitive: ACRObject,
  creatingPrimitive: ACRObject,
  creatingPrimitiveParent: ACRObject,
  modifyingPrimitive: ACRObject,

  drawScaleFactor: Point,
  doubleTap: Point,

  absoluteMouseCord: Point,
  canvasMouseCord: Point,

  interactionMode: InteractionMode,

  ready: Boolean,
};

class InteractiveACRModifier extends Component<InteractiveACRModifierProps, InteractiveACRModifierState> {

  imageRef: RefObject<HTMLImageElement>;

  imageRefWidth: number;
  imageRefHeight: number;

  canvasRef: HTMLDivElement;

  panelWidth: number;
  panelHeight: number;

  implicitCanvasACRObject: ACRObject;

  idGenerator: {
    newId: () => number;
  }

  constructor(props, context){

    super(props, context);

    this.imageRef = React.createRef<HTMLImageElement>();

    this.state = {
      canvasSize: { width: '100%', height: '100%' },
      selectedPrimitive: null,
      // Corresponds to the primitive which is currently being created (via
      // dragging) by the user.
      creatingPrimitive: null,
      // The parent of the current primitive being created. This is stored as a
      // reference so that we do not have to continuously search the contains hierarchy
      // everytime the mouseMove event is fired.
      creatingPrimitiveParent: null,

      availablePrimitives: [],

      modifyingPrimitive: null,

      // We initialise the draw scale factor to be 1 for both x and y initially. As soon as we resize the canvas, this 
      // will be updated.
      drawScaleFactor: [1, 1],
      doubleTap: [0, 0],

      // The absolute mouse coordinates.
      absoluteMouseCord: [0, 0],
      
      // The mouse coordinates with respect to the canvas. This is used for the creation of 
      // new primitives, as well as re-sizing.
      canvasMouseCord: [0, 0],

      // The interaction mode specifies how the user is currently interacting with
      // the canvas.
      // 'select' allows the user to select and move primitives.
      // 'add' allows users to create new primitives.
      interactionMode: InteractionMode.Select,

      ready: false
    };

    this.setSourceImageRef = this.setSourceImageRef.bind(this);
    this.onResize = this.onResize.bind(this);
    this.updateImageSizeProperties = this.updateImageSizeProperties.bind(this);
    this.editPrimitive = this.editPrimitive.bind(this);
    this.generateBoundingBox = this.generateBoundingBox.bind(this);

    // Toolbar handlers: Navigation.
    this.generateCodeHandler = this.generateCodeHandler.bind(this);
    this.goBackHandler = this.goBackHandler.bind(this);

    // Toolbar handlers: Modification.
    this.duplicatePrimitiveHandler = this.duplicatePrimitiveHandler.bind(this);
    // :Interaction
    this.changeInteractionModeHandler = this.changeInteractionModeHandler.bind(this);
    // :Adding primitives and canvas click handling.
    this.onBackgroundClickHandler = this.onBackgroundClickHandler.bind(this);
    this.canvasMouseDownHandler = this.canvasMouseDownHandler.bind(this);
    this.canvasMouseUpHandler = this.canvasMouseUpHandler.bind(this);
    this.canvasMouseMoveHandler = this.canvasMouseMoveHandler.bind(this);

    // Register key listener for deleting primitives.
    document.addEventListener('keyup', (e) => e.keyCode === 8 && this.removeSelectedPrimitive());

    // Instantiate the ID generator.
    this.idGenerator = new IDGenerator(this.props.project.acr);

  }

  // CHECKPOINT: For some reason, the imageRef properties are zero'd out until a resize, or interaction with the page, is trigerred.
  componentDidMount(){

    // log(`Creating implicit canvasACRObject.`);
    console.log(this.imageRef.current);
    
    // Update implicit canvasACR element which will simply be used as the
    // top level ACR object. It contains no useful information and is simply
    // used to support functions which require the use of a parent acr object,
    // on objects such as panels which are natively the top level elements of the
    // ACR representation.
    this.implicitCanvasACRObject = ACRObject.fromJSON({
      meta: {
        absoluteWidth: this.imageRef.current.naturalWidth,
        absoluteHeight: this.imageRef.current.naturalHeight,
        vertices: [[0,0]]
      },
      id: "canvas",
      contains: []
    });

    // log(`Image ref W & H`,this.imageRef.current.naturalWidth, this.imageRef.current.naturalHeight);
    // log(`Implicit Canvas ACR Object W & H: ${this.implicitCanvasACRObject.meta.absoluteWidth}, ${this.implicitCanvasACRObject.meta.absoluteHeight}`)

    // log(`ImageRef W & H: ${this.imageRef.current.width}, ${this.imageRef.current.height}`);
    // log(`Created implicitCanvasACRObject:`, this.implicitCanvasACRObject);

    // Perform some pre-processing on the ACR. All top-level shapes should be nested within the ImplicitCanvasACRObject.
    log(`Instantiating ACR Modifier with project:`, this.props.project);
    // this.props.project.acr.forEach(object => object.parentId = "None");
    this.props.project.acr.forEach(object => this.implicitCanvasACRObject.addContainingShape(object));


    this.panelWidth = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteWidth : 0;
    this.panelHeight = this.props.project.acr.length !== 0 ? this.props.project.acr[0].meta.absoluteHeight : 0;
    
    // Here, we are dividing the width and height of the highest level shape in the ACR, by it's relative width and height. Since the 
    // relative width and height of the top-level objects represent the size in proportion to the source image, dividing the absolute 
    // value by the relative width and height should return the source image height. This, however, is problematic as the 
    // relative width and height is dynamically calculated based off of the parent. Perhaps we could solve this by ensuring the implicit 
    // canvas ACR object initially has the width and height of the source image?
    // this.sourceImageHeight = this.panelHeight !== 0 ? this.panelHeight / (parseFloat(this.props.project.acr[0].meta.relativeHeight) / 100) : 0;
    // this.sourceImageWidth = this.panelWidth !== 0 ? this.panelWidth / (parseFloat(this.props.project.acr[0].meta.relativeWidth) / 100) : 0;

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

  setSourceImageRef(ref){
    log(`Setting source image ref to:`, ref);
    this.imageRef = {
      current: ref
    };
    this.updateImageSizeProperties();
  }

  updateImageSizeProperties(){

    // console.log(this.imageRef.current);

    // If the image ref has not been set, exit the function early.
    if (!this.imageRef || !this.imageRef.current) return;

    // log(`Updating image size properties. 
    //   Source image W & H: ${this.sourceImageWidth}, ${this.sourceImageHeight}. 
    //   Actual image element W & H: ${this.imageRef.current.width}, ${this.imageRef.current.height}`);


    this.setState({
      canvasSize: {
        width: this.imageRef.current.width,
        height: this.imageRef.current.height
      },
      drawScaleFactor: [
        this.imageRef.current.naturalWidth / this.imageRef.current.width,
        this.imageRef.current.naturalHeight / this.imageRef.current.height
      ]
    });

    // Check if the implicitCanvasACRObject has been initialised.
    if (!this.implicitCanvasACRObject) return;

    // Here we are updating the absolute width and height of the implicit canvas ACR object - understandably, we will receive NaNs, 
    // and infinities if the drawScaleFactor is 0, or also infinite / NaN.
    // this.implicitCanvasACRObject.meta.absoluteWidth = this.imageRef.current.width * this.state.drawScaleFactor[0];
    // this.implicitCanvasACRObject.meta.absoluteHeight = this.imageRef.current.height * this.state.drawScaleFactor[1];
    this.implicitCanvasACRObject.meta.absoluteWidth = this.imageRef.current.naturalWidth;
    this.implicitCanvasACRObject.meta.absoluteHeight = this.imageRef.current.naturalHeight;

  }

  onResize(x, y){
    this.updateImageSizeProperties();
  }

  // Handles background clicks used to close edit dialogues.
  onBackgroundClickHandler(){
    this.setState({
      ...this.state,
      modifyingPrimitive: null
    })
  }

  // Handles creation of new ACR objects if the user is in 'add' mode.
  // TODO: Fix positioning of drawn container
  // TODO: Ensure that we can drag above and to the left of the initial click point
  canvasMouseDownHandler(e){


    // If there is already a primitive being created, ignore the mouse down
    // handler.
    if (this.state.creatingPrimitive) return;
    if (this.state.interactionMode !== InteractionMode.Add) return;

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
      left: this.state.canvasMouseCord[0],
      top: this.state.canvasMouseCord[1],
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
  canvasMouseMoveHandler(e: React.MouseEvent){

    // Create a new ACR object at the current mouse position, and auto-drag on the
    // corner of the shape until the mouse is released. We need to add it
    // to the current shape being clicked on.
    let absoluteMouseCord: Point = [e.pageX, e.pageY];
    let canvasCords: Point = [this.canvasRef.offsetLeft, this.canvasRef.offsetTop];

    // Update left and top so that the coordinates are given with respect to the bounding
    // box.
    let canvasSize = { 
      height: this.canvasRef.offsetHeight, 
      width: this.canvasRef.offsetWidth 
    };

    // Convert the mouse object into relative coordinates of the object canvas (
    // or perhaps of the bounding box we have selected).
    let canvasMouseCord = convertGlobalToBoundingBoxCoordinates(
      absoluteMouseCord, 
      canvasCords
    );

    // log(`Converted global coordinates`, globalCoords, `to bounding-box coordinates:`, [left, top]);


    // Set the absolute and canvas mouse position coordinates for the state.
    this.setState({
      ...this.state,
      absoluteMouseCord,
      canvasMouseCord
    })

    // Ensure we exit early if the user is not in 'add' mode, or the creatingPrimitve
    // has not yet been created.
    if (this.state.interactionMode !== InteractionMode.Add
      || !this.state.creatingPrimitive
      || !this.state.creatingPrimitiveParent
    ) return;

    // Fetch the initial left and top values for the primitive.
    // We no longer use nativeEvent.offSet[x/y] as this continuously gets reset
    // as the mouse hovers over other objects which also have mouse handlers, causing
    // the creating primitive to needlessly jump around.
    let [initialLeft, initialTop]: Point = this.state.creatingPrimitive.meta.initialVertices[0];

    // let height = e.nativeEvent.offsetY;
    // let width = e.nativeEvent.offsetX;

    // We need to ensure that we are also converting the absolute mouse coordinates to relative 
    // canvas coordinates at this point, to ensure that the corner of the object remains beneath 
    // the mouse.
    let mouseCords: Point = [e.pageX, e.pageY];
    let boundingBoxCords: Point = [this.canvasRef.offsetLeft, this.canvasRef.offsetTop];

    // Convert the mouse object into relative coordinates of the object canvas (
    // or perhaps of the bounding box we have selected).
    let [canvasX, canvasY] = convertGlobalToBoundingBoxCoordinates(mouseCords, boundingBoxCords);

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

    if (midX) midX *= this.state.drawScaleFactor[0];
    if (midY) midY *= this.state.drawScaleFactor[1];
    if (left) left *= this.state.drawScaleFactor[0];
    if (top) top *= this.state.drawScaleFactor[1];


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

  selectPrimitive(primitive){
    this.setState({
      ...this.state,
      selectedPrimitive: primitive
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
  async editPrimitive(e, primitive){

    if (!this.state.availablePrimitives || this.state.availablePrimitives.length == 0){
      // Fetch available primitives from the backend.
      var primitives = await fetchAvailablePrimitives();
      this.setState({
        ...this.state,
        availablePrimitives: primitives.map(primitive => Object({
          text: primitive,
          value: primitive,
          icon: Icon[`${primitive[0].toUpperCase()+primitive.substring(1, primitive.length)+'Icon'}`]
        }))
      })
    }

    this.setState({
      ...this.state,
      doubleTap: [e.x, e.y],
      modifyingPrimitive: primitive
    });

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

    // if (parent.id !== "canvas") width *= this.state.drawScaleFactor[0];
    // if (parent.id !== "canvas") height *= this.state.drawScaleFactor[1];

    // We need to multiply the deltas in width and height by the draw-scale factor in order to convert from browser coordinates to ACR 
    // coordinates.
    width *= this.state.drawScaleFactor[0];
    height *= this.state.drawScaleFactor[1];

    //log(`Resizing ${primitive.id} to`, width, height);

    resizeACRObject(primitive, parent, width, height);
    
    // Redraw.
    this.setState(this.state);

  }

  movePrimitive({primitive, parent}: {primitive: ACRObject, parent: ACRObject}, {dx, dy}){

    // Select the current primitive.

    // Scale dx and dy by the width and height of the parent window.
    dx *= this.state.drawScaleFactor[0];
    dy *= this.state.drawScaleFactor[1];

    // console.log(`Moving ${primitive.id} by`, dx, dy);

    // moveACRObject({primitive}, dx, dy);
    primitive.displace({x: dx, y: dy})

    // Force a redraw.
    this.forceUpdate()
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
    dropzone={{
      ondropactivate: event => {
        event.target.classList.add('drop-active')
        // console.log(primitive.id, `is active for dropping.`);
      },
      ondropdeactivate: event => {
        event.target.classList.remove('drop-active');
        // console.log(primitive.id, `no longer active for dropping.`);
      },

      // ondrop: event => {
      //   this.nestWithinNewParent(event.relatedTarget, event.target)
      // }
    }}
    // Ensure that the object is only interactable when the user is in selection
    // mode.
    draggable={this.state.interactionMode === InteractionMode.Select}
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
      this.editPrimitive(e, primitive)
    }
    onDown={(e: MouseEvent) => {
        // We need to ensure that the event propagates so that we capture the mouse movement
        // used to create new primitives.
        // e.stopPropagation() || e.preventDefault() ||
        // Ensure that we prevent selection of a new primitive while we are in the
        // middle of creating a new one, as this will cause a new state update and
        // change the prospective parent of the primitive.
        if (this.state.creatingPrimitiveParent) return;
        if (this.state.interactionMode !== InteractionMode.Add) {
          console.log(`Preventing propagation`);
          e.preventDefault();
          e.stopPropagation();
        }

        // TEMP: Select primitive using the object used to construct the bounding box, 
        // rather than trying to find the primitive by using the ID attached to the div's 
        // data-id property.

        // Select the primitive if it is a left click.
        this.selectPrimitive(primitive);

        // Open the edit primitive dialogue in addition to this, if it is a right click.
        if (e.button == 2) {
          e.preventDefault();
          e.stopPropagation();
          this.editPrimitive(e, this.state.selectedPrimitive);
        }
      }
    }
    // Ensure that the primitive is visible on top of all other primitives.
    onDragStart={() => {
      let selectedPrimitive = this.state.selectedPrimitive;
      selectedPrimitive.dragging = true;
      this.setState({...this.state, selectedPrimitive})
    }}
    onDragEnd={() => {
      let selectedPrimitive = this.state.selectedPrimitive;
      selectedPrimitive.dragging = false;
      this.setState({...this.state, selectedPrimitive})
    }}
    onDragMove={
      (e) => {
        let {dx, dy} = e;
        // If we are not in selection mode, then we should return before the
        // primitive location is altered.
        if (this.state.interactionMode !== InteractionMode.Select) return;
        // var primitive = this.findACRObjectById(target.dataset.id);
        var parent = this.findACRObjectById(primitive.parentId);
        this.movePrimitive({
          primitive: primitive,
          parent: parent
        }, {dx, dy});
        e.preventDefault();
      }
    }
    // onHold={
    //   e => {
    //     e.stopPropagation();
    //    this.createPrimitive(this.findACRObjectById(e.currentTarget.dataset.id), {
    //      left: this.state.canvasMouseCord[0], top: this.state.canvasMouseCord[1],
    //     })
    //   }
    // }
    onResizeMove={
      e => {
        if (this.state.interactionMode !== InteractionMode.Select) return;
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
            absoluteWidth: this.imageRef.current.width * this.state.drawScaleFactor[0],
            absoluteHeight: this.imageRef.current.height * this.state.drawScaleFactor[1],
            vertices: [[0,0]]
          },
          id: "canvas",
          contains: []
    })
  {
    if (!acr || acr.length === 0) return "";

    // console.log(`Drawing primitives for parnet:`, parent);

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
    duplicated.parent = parentPrimitive;
    parentPrimitive.contains.push(duplicated);

    this.setState(this.state);

    // Change the interactionHandler back to select.
    this.changeInteractionModeHandler(InteractionMode.Select);

  }

  changeInteractionModeHandler(interactionMode: InteractionMode){
    // Clear the selected primitive, creating primitive(s) and set the interaction mode.
    this.setState({
      ...this.state,
      selectedPrimitive: null,
      creatingPrimitive: null,
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
      <div 
        className="acr-mod-container"
        onClick={() => this.onBackgroundClickHandler()}
        onContextMenu={e => e.preventDefault()}
      >

        <Toolbar

        generateCodeHandler={this.generateCodeHandler}
        goBackHandler={this.goBackHandler}

        // Primitive modification handlers (selection, creation, duplication).
        duplicatePrimitiveHandler={this.duplicatePrimitiveHandler}

        // Interaction mode handlers.
        selectButtonHandler={() => this.changeInteractionModeHandler(InteractionMode.Select)}
        addPrimitiveHandler={() => this.changeInteractionModeHandler(InteractionMode.Add)}
        absoluteMouse={this.state.absoluteMouseCord}
        canvasMouse={this.state.canvasMouseCord}
        debugMode={this.props.debugMode}

        // Pass the current interaction mode.
        interactionMode={this.state.interactionMode}
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
                x={this.state.doubleTap[0]}
                y={this.state.doubleTap[1]}
                primitive={this.state.modifyingPrimitive}
                onChangePrimitiveType={type => this.setPrimitiveType(type)}
                onClose={() => this.endPrimitiveSelection()}
                primitiveTypes={this.state.availablePrimitives}
                
                draggable={true}
                onDragMove={
                  (e) => {
                    let {dx, dy} = e;
                    this.setState({
                      doubleTap: [this.state.doubleTap[0] + dx, this.state.doubleTap[1] + dy]
                    })
                    // If we are not in selection mode, then we should return before the
                    // primitive location is altered.
                    // if (this.state.interactionMode !== InteractionMode.Select) return;
                    // var primitive = this.findACRObjectById(target.dataset.id);
                    // var parent = this.findACRObjectById(primitive.parentId);
                    // this.movePrimitive({
                    //   primitive: primitive,
                    //   parent: parent
                    // }, {dx, dy});
                    // e.preventDefault();
                  }
                }
                />
              : ""
            }


          <ResizeDetector handleWidth handleHeight onResize={this.onResize}>

          <div
            style={{
              width: this.state.canvasSize.width,
              height: this.state.canvasSize.height,
              position: 'absolute',
              cursor: this.state.interactionMode === InteractionMode.Add ? 'crosshair' : 'unset'
            }}
            className="acr-object-canvas"
            // onMouseDown={this.canvasMouseDownHandler}
            // onMouseMove={this.canvasMouseMoveHandler}
            onMouseUp={this.canvasMouseUpHandler}
            ref={ref => this.canvasRef = ref}
          >

          {
            /* Draw ACR Bounding boxes */
            this.state.ready ? this.drawPrimitives(this.props.project.acr) : ""
          }

          </div>

          <img 
          alt="Background Canvas" 
          // ref={ref => {
          //   this.imageRef.current.= ref;
          //   log(`Setting imageRef to:`);
          //   console.log(ref);
          // }} 
          ref={this.setSourceImageRef}
          style={{
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
