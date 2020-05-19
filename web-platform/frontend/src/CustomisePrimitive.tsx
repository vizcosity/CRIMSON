/**
 * Module for UI supporting primitive customisation.
 *
 * @ Aaron Baw 2019
 */

import React, { Component } from 'react';
import { CloseIcon } from './Icons';
import { Checkbox } from 'semantic-ui-react';
import { ACRObject } from 'crimson-inference/modules/ACR';
import Reactable from 'reactablejs';
import { Fade } from 'react-reveal';

// import Icon from './Icons';
// import Reactable from 'reactablejs';

type ContainedPrimitiveProps = {
  primitive: ACRObject,
  removePrimitive: any,
  parent: ACRObject,
}

class ContainedPrimitive extends Component<ContainedPrimitiveProps> {

  constructor(props, context){
    super(props, context);
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

type ContainedPrimitivesFieldProps = {
  primitive: ACRObject
}

// Display all contained primitives for the current primitive, with the ability to
// remove primitives as desired.
class ContainedPrimitivesField extends Component<ContainedPrimitivesFieldProps> {
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

type GenerateLoginOptionProps = {
  primitive: any
}

class GenerateLoginOption extends Component<GenerateLoginOptionProps> {

  constructor(props, context){
    super(props, context);
    this.state = {};
    this.toggleLogin = this.toggleLogin.bind(this);
  }

  toggleLogin(e){
    this.props.primitive.generateAuth = !this.props.primitive.generateAuth;
    console.log(`Altered primitive:`, this.props.primitive);
    this.setState(this.state);
  }

  render(){
    return (<div className="generate-login-option-container">
      <p>Generate Login Code</p>
      <Checkbox checked={this.props.primitive.generateAuth} onChange={this.toggleLogin} style={{
        marginLeft: 'auto'
      }} toggle />
    </div>);
  }
}

const PrimitiveTypeOption = ({active, onClick, icon, type}) =>  (
      <button
      onClick={onClick}
      className={`${active ? 'active ' : ''}button-fade button-enlarge primitive-type-option-container`}>
        {icon()}
        <p style={{
          marginTop: '10px'
        }}>{type}</p>
      </button>
);

type EditDialogueProps = {

  primitive: ACRObject | any,
  primitiveTypes: any[],
  onClose: any,
  onChangePrimitiveType: any,

  getRef: any,

  x: number,
  y: number

}

type EditDialogueState = {
  x: number,
  y: number
}

class EditDialogueUnreactable extends Component<EditDialogueProps, EditDialogueState> {

  constructor(props, context){
    super(props, context);
    this.state = {
      x: this.props.x,
      y: this.props.y
    };
  }

  setPrimitiveText(text){
    (this.props.primitive as any).content = text;
  }


  render(){
    return (
      <Fade 
      top 
      duration={500} 
      distance="10px"
      collapse>
      <div 
      // Prevent propagation so that we stop the dialogue from closing when interacting with it - as the parent div 
      // captures all background mouse events in order to close the dialogue when clicking outside of it.
      onClick={e => e.stopPropagation()}
      ref={this.props.getRef}
      style={{
        position: 'absolute',
        zIndex: 10,
        left: this.props.x,
        top: this.props.y
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


        {
          // Display generatelogin option if 'login' detected.
          typeof (this.props.primitive as any).generateAuth !== 'undefined' ?
          <GenerateLoginOption primitive={this.props.primitive}/> : ""

        }


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
          }}
          className="subtext">
            x: {Math.round(this.props.primitive.meta.midpoint[0])}   y: {Math.round(this.props.primitive.meta.midpoint[1])}  |
              width: {Math.round(this.props.primitive.meta.absoluteWidth)}  height: {Math.round(this.props.primitive.meta.absoluteHeight)}
          </p>
        </div>

          
      </div>
      </Fade>
    );
  }
}

const EditDialogue = Reactable(EditDialogueUnreactable);

export default EditDialogue;
