/**
 * Module for UI supporting primitive customisation.
 *
 * @ Aaron Baw 2019
 */

import React, { Component } from 'react';
import { CloseIcon } from './Icons';

class PrimitiveTypeOption extends Component {
  render(){
    return (
      <div className="primitive-type-option-container">
        {this.props.icon}
        <h3>{this.props.text}</h3>
      </div>
    );
  }
}

class EditDialogue extends Component {


  constructor(props, context){
    super(props, context);
    console.log(this.props.primitive);
    this.closeDialogue = this.closeDialogue.bind(this);
  }

  setPrimitiveType(type){
    this.props.primitive.type = type;
  }

  setPrimitiveText(text){
    this.props.primitive.content = text;
  }

  closeDialogue(){

    // TODO: Add onClose prop function from parent which handles
    // closing of the dialogue.
  }

  render(){
    return (
      <div className="edit-dialogue-container">

        <div className="edit-dialogue-header-container">
          <h2>Edit Rectangle 4</h2>
          <CloseIcon style={{
            marginLeft: 'auto',
          }} onClick={this.closeDialogue} />
        </div>

        <div classname="edit-dialogue-primitive-type-container">
          {
            this.props.primitiveTypes.map(
              ({type, icon}) => <PrimitiveTypeOption type={type} icon={icon} />
            )
          }
        </div>

        <div className="edit-dialogue-component-properties-container">
          <div className="edit-dialogue-text-edit-container">
            <p>Text</p>
            <input
              type="text"
              value="Primitive val"
              onChange={
                e => this.props.primitive.text = e.target.value
              }
            />
          </div>
        </div>

        <div className="edit-dialogue-meta-container">
          <p className="subtext">
            x: {this.props.primitive.meta.midpoint[0]}   y: {this.props.primitive.meta.midpoint[1]}
              width: {this.props.primitive.meta.absoluteWidth}  height: {this.props.primitive.absoluteHeight}
          </p>
        </div>


      </div>
    );
  }
}

export default EditDialogue;
