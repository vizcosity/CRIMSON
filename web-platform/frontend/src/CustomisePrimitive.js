/**
 * Module for UI supporting primitive customisation.
 *
 * @ Aaron Baw 2019
 */

import React, { Component } from 'react';
import { CloseIcon } from './Icons';
import Reactable from 'reactablejs';

class ContainedPrimitive extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {};
  }

  render(){
      return (
        <div className="horizontal-container contained-primitive-container">
          <p>{this.props.primitive.type} [{this.props.primitive.id}]</p>

          <button style={{
            margin: '0px 0px 0px auto'
          }} onClick={() => this.props.removePrimitive(this.props.primitive, this.props.parent)} className="button-fade">
            <CloseIcon style={{
              height: '10px'
            }} />
          </button>
        </div>
      );
  }

}

// Display all contained primitives for the current primitive, with the ability to
// remove primitives as desired.
class ContainedPrimitivesField extends Component {
  constructor(props, context){
    super(props, context);
    this.removePrimitive = this.removePrimitive.bind(this);
  }

  removePrimitive(primitive, parent){
    console.log(`CUSTOMISE PRIMITIVE | Removing `, primitive.id, `from`, parent.id);
    parent.contains = parent.contains.filter(s => s.id !== primitive.id);

    // Force a render to update changes visually.
    this.setState({
      ...this.state
    });
  }

  render(){
    return (<div className="edit-dialogue-contained-primitives-container">

    {
      this.props.primitive.contains.length > 0 ? 
      <p> Nested shapes </p>
      : ""
    }

      {
        this.props.primitive.contains.map(primitive =>
          <ContainedPrimitive
            primitive={primitive}
            parent={this.props.primitive}
            removePrimitive={this.removePrimitive}
          />
        )
      }
    </div>);
  }

}

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
      }} className="edit-dialogue dialogue-container">

        <div className="dialogue-header-container">
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
              ({value, icon}, key) =>
              <PrimitiveTypeOption
                onClick={() => this.props.onChangePrimitiveType(value)}
                key={key}
                type={value}
                icon={icon}
                active={this.props.primitive.type.toLowerCase() === value.toLowerCase()}
              />
            )
          }
        </div>

        <ContainedPrimitivesField primitive={this.props.primitive} />

        </div>

        <div className="edit-dialogue-component-properties-container">
          <div className="dialogue-text-edit-container">
            <p>Text</p>
            <input
              placeholder={this.props.primitive.content}
              onChange={
                e => this.props.primitive.content = e.target.value
              }
            />
          </div>
        </div>

        <div className="edit-dialogue-meta-container">
          <p style={{
            marginTop: '10px'
          }}className="subtext">
            x: {Math.round(this.props.primitive.meta.midpoint[0])}   y: {Math.round(this.props.primitive.meta.midpoint[1])}  |
              width: {Math.round(this.props.primitive.meta.absoluteWidth)}  height: {Math.round(this.props.primitive.meta.absoluteHeight)}
          </p>
        </div>


      </div>
    );
  }
}

export default EditDialogue;
