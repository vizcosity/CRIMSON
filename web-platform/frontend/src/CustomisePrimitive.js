/**
 * Module for UI supporting primitive customisation.
 *
 * @ Aaron Baw 2019
 */

import React, { Component } from 'react';
import { CloseIcon } from './Icons';
import Reactable from 'reactablejs';

class PrimitiveTypeOption extends Component {
  render(){
    console.log('generating', this.props.type);
    return (
      <button
      onClick={this.props.onClick}
      className={`${this.props.active ? 'active ' : ''}button-fade primitive-type-option-container`}>
        {this.props.icon()}
        <p style={{
          marginTop: '10px'
        }}>{this.props.type}</p>
      </button>
    );
  }
}

class EditDialogue extends Component {


  constructor(props, context){
    super(props, context);
    this.state = {
      x: this.props.x,
      y: this.props.y
    };
    // this.setPrimitiveType = this.setPrimitiveType.bind(this);
  }

  // setPrimitiveType(type){
  //   this.props.primitive.type = type;
  //   console.log(this.props.primitive.type);
  //   this.setState(this.state);
  // }

  setPrimitiveText(text){
    this.props.primitive.content = text;
  }


  render(){
    return (
      <div style={{
        position: 'absolute',
        zIndex: 10,
        left: this.state.x,
        top: this.state.y
      }} className="edit-dialogue-container">

        <div className="edit-dialogue-header-container">
          <h2>Edit {this.props.primitive.type} {this.props.primitive.id}</h2>
          <button className="button-fade"
            style={{
              marginLeft: 'auto',
            }}
            onClick={this.props.onClose}>
          <CloseIcon  />
          </button>
        </div>


        <div className="edit-dialogue-primitive-type-and-header-wrap">
        <p style={{
          marginBottom: '10px',
        }}>Select Shape Type </p>
        <div className="edit-dialogue-primitive-type-container">
          {
            this.props.primitiveTypes.map(
              ({type, icon}, key) =>
              <PrimitiveTypeOption
                onClick={() => this.props.onChangePrimitiveType(type)}
                key={key}
                type={type}
                icon={icon}
                active={this.props.primitive.type.toLowerCase() === type.toLowerCase()}
              />
            )
          }
        </div>
        </div>

        <div className="edit-dialogue-component-properties-container">
          <div className="edit-dialogue-text-edit-container">
            <p>Text</p>
            <input
              style={{
                marginLeft: '20px',
                width: '-webkit-fill-available'
              }}
              type={this.props.primitive.text}
              onChange={
                e => this.props.primitive.text = e.target.value
              }
            />
          </div>
        </div>

        <div className="edit-dialogue-meta-container">
          <p style={{
            marginTop: '10px'
          }}className="subtext">
            x: {this.props.primitive.meta.midpoint[0]}   y: {this.props.primitive.meta.midpoint[1]}  |
              width: {this.props.primitive.meta.absoluteWidth}  height: {this.props.primitive.meta.absoluteHeight}
          </p>
        </div>


      </div>
    );
  }
}

export default EditDialogue;
