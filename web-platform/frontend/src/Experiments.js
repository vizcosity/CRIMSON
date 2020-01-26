/**
 * Page for conducting UI experiments, such as experimental click and drag to
 * create a new primitive.
 *
 * @ Aaron Baw 2020
 */

import React, { Component } from 'react';
import Reactable from 'reactablejs';

const BoundingBoxComponent = ({
  getRef,
  height,
  width,
  left,
  top,
  i,
  selectable = true,
  draggable,
  resizable,
  onUp,
  children
}) => {

return (<div
ref={getRef}
className={"bounding-box"}
data-x={left}
data-y={top}
data-height={height}
data-width={width}
// data-id={shape.id}
style={{
  position: 'absolute',
  height: `${height}px`,
  width: `${width}px`,
  top: `${top}px`,
  left: `${left}px`,
  // pointerEvents: selectable ? 'unset' : 'none'
  // transform: `translateX(${meta.vertices[0][0]}px) translateY(${meta.vertices[0][1]}px)`
}}>
<label>[{i}] {left},{top} - {width},{height}</label>
{children}
</div>)}

// const throttle = (f) => {
//     let token = null, lastArgs = null;
//
//     const invoke = () => {
//         f(...lastArgs);
//         token = null;
//     };
//
//     const result = (...args) => {
//         lastArgs = args;
//         if (!token) {
//             // Token here is a timestamp.
//             token = requestAnimationFrame(invoke);
//         }
//     };
//
//     result.cancel = () => token && cancelAnimationFrame(token);
//     return result;
// };


const BoundingBox = Reactable(BoundingBoxComponent);

export default class Experiments extends Component {

  constructor(props, context){
    super(props, context);

    this.state = {
      boxes: [],
      newPrimitive: null,
      selectedPrimitive: null
    }

    this.clickAndDragHandler = this.clickAndDragHandler.bind(this);
    this.newBox = this.newBox.bind(this);
  }

  // Handler used to create a new primitive while the mouse is being pressed.
  clickAndDragHandler(e){

    if (!this.state.newPrimitive) return;

    let {initialLeft, initialTop} = this.state.newPrimitive;
    let width = Math.abs(e.pageX - initialLeft);
    let height = Math.abs(e.pageY - initialTop);
    let left = e.pageX > initialLeft ? initialLeft : initialLeft - width;
    let top = e.pageY > initialTop ? initialTop  : initialTop - height;

    throttle(
    this.setState({
      ...this.state,
      newPrimitive: {
        ...this.state.newPrimitive,
        width,
        height,
        left,
        top
      }
    })
  );
    e.preventDefault();
  }

  newBox(x, y, width, height){
    return {
      left: x,
      top: y,
      // Store the initial x and y coordinates so that we can support resizing
      // the primitive to the left of the initialX, and above the initialY
      // coordinates.
      initialLeft: x,
      initialTop: y,
      width,
      height
    }
  }

  render(){
    return (
      <div
      onMouseMove={(e) => this.clickAndDragHandler(e)}
      onMouseDown={e => this.setState({...this.state, newPrimitive: this.newBox(e.pageX, e.pageY, 0, 0)})}
      onMouseUp={() =>
        // When we release the mouse button, add the new Primitive to the array
        // of boxes.
        this.setState({
          ...this.state,
          boxes: [...this.state.boxes, this.state.newPrimitive],
          newPrimitive: null,
        })
      }
      style={{
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
        webkitUserSelect: 'none'
      }}>
      Selected Primitive: {`${require('util').inspect(this.state.selectedPrimitive)}`}

      {
        this.state.boxes.map((box, i) =>
          <BoundingBox
            {...box}
            i={i}
            onDown={() => this.setState({
              selectedPrimitive: box
            })}
            draggable
            onUp={() => this.setState({
              selectedPrimitive: box
            })}
            onDragMove={
              ({target, dx, dy}) => {
                if (this.state.newPrimitive) return;
                box.left += dx;
                box.top += dy;
              }
            }
          />
        )
      }

      {
        this.state.newPrimitive ?
        <BoundingBox
            {...this.state.newPrimitive}
        />
        : ""
      }
      </div>
    );
  }
}

const throttle = (f) => {
/*     let token = null, lastArgs = null;
    const invoke = () => {
        f(...lastArgs);
        token = null;
    };
    const result = (...args) => {
        lastArgs = args;
        if (!token) {
            token = requestAnimationFrame(invoke);
        }
    };
    result.cancel = () => token && cancelAnimationFrame(token);
    return result; */
    return f;
};

class Draggable extends React.PureComponent {
    _relX = 0;
    _relY = 0;
    _ref = React.createRef();

    constructor(props, context){
    super(props, context);
    this.state = {
    width: '100px',
    height: '100px',
    moving: false
    }
    }

    _onMouseDown = (event) => {
        if (event.button !== 0) {
            return;
        }
        const {scrollLeft, scrollTop, clientLeft, clientTop} = document.body;
        // Try to avoid calling `getBoundingClientRect` if you know the size
        // of the moving element from the beginning. It forces reflow and is
        // the laggiest part of the code right now. Luckily it's called only
        // once per click.
        const {left, top} = this._ref.current.getBoundingClientRect();
        this._relX = event.pageX - (left + scrollLeft - clientLeft);
        this._relY = event.pageY - (top + scrollTop - clientTop);
        // document.addEventListener('mousemove', this._onMouseMove);
        // document.addEventListener('mouseup', this._onMouseUp);
        this.setState({...this.state, moving: true})
        event.preventDefault();
    };

    _onMouseUp = (event) => {
        // document.removeEventListener('mousemove', this._onMouseMove);
        // document.removeEventListener('mouseup', this._onMouseUp);
        this.setState({...this.state, moving: false})
        event.preventDefault();
    };

    _onMouseMove = (event) => {
        // if (!this.state.moving) return;
       // this.props.onMove(
       //      event.pageX - this._relX,
       //      event.pageY - this._relY,
       //  );
        this.setState({
          width: event.pageX - this._relX,
          height: event.pageY - this._relY
        });
        console.log(event.pageX, event.pageY);
        event.preventDefault();
    };

    _update = throttle(() => {
        // const {x, y} = this.props;
        //  // this._ref.current.style.transform = `translate(${x}px, ${y}px)`;
        // // this._ref.current.style.width = `${x}px`
        // // this._ref.current.style.height = `${y}px`
        // this.setState({
        //   width: `${x}px`,
        //   height: `${y}px`
        // });
    });

    componentDidMount() {
        //this._ref.current.addEventListener('mousedown', this._onMouseDown);
        //this._update();
    }

    // componentDidUpdate() {
    //     this._update();
    // }

    componentWillUnmount() {
        //this._ref.current.removeEventListener('mousedown', this._onMouseDown);
        this._update.cancel();
    }

    render() {
        return (
            <div
              style={{
                width: '100%',
                height: '100%'
              }}
              onMouseDown={this._onMouseDown}
              onMouseUp={this._onMouseUp}
              onMouseMove={this._onMouseMove}
               className="draggable" ref={this._ref}>
               <div style={{
             	width: this.state.width,
               height: this.state.height,
               border: '2px dashed #78909C',
               backgroundColor: 'rgba(240, 248, 255, 0.8)',
               position: 'absolute',
               zIndex: '1',
               boxSizing: 'border-box',
               display: 'flex',
               //transition: '0.15s ease-in-out',
               borderRadius: '5px'
             }}></div>
                {this.props.children}
            </div>
        );
    };
}

class Experiments_new extends React.PureComponent {
    state = {
        x: 100,
        y: 200,
    };

    _move = (x, y) => this.setState({x, y});

    // you can implement grid snapping logic or whatever here
    /*
    _move = (x, y) => this.setState({
        x: ~~((x - 5) / 10) * 10 + 5,
        y: ~~((y - 5) / 10) * 10 + 5,
    });
    */

    render() {
        const {x, y} = this.state;
        return (
            <Draggable x={x} y={y} onMove={this._move}>

            </Draggable>
        );
    }
}
