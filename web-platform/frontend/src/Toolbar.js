/**
 * Toolbar component for interfacing with the InteractiveACRModifier component.
 *
 * @ Aaron Baw
 */

import React, { Component } from 'react';
import { Fade } from 'react-reveal';

// Import Assets.
import SelectPrimitiveIcon from './assets/SelectPrimitiveIcon';
import AddPrimitiveIcon from './assets/AddPrimitiveIcon';
import BackIcon from './assets/BackIcon';
import DuplicatePrimitiveIcon from './assets/DuplicatePrimitiveIcon';
import GenerateCodeIcon from './assets/GenerateCodeIcon';
import HelpIcon from './assets/HelpIcon';

// Import Styles.
import './Styles/Toolbar.css';

export default class Toolbar extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      hoverText: "",
      selectedButton: "Select"
    }

    this.setHoverText = this.setHoverText.bind(this);
    this.clearHoverText = this.clearHoverText.bind(this);
    this.selectButton = this.selectButton.bind(this);
  }

  setHoverText(hoverText){
    this.setState({
      ...this.state,
      hoverText
    });
  }

  selectButton(selectedButton){
    this.setState({
      selectedButton
    })
  }

  clearHoverText(){
    this.setHoverText("");
  }

  render(){
    return (
      <div className="modify-acr-toolbar-container">

      <Fade appear when={this.state.hoverText}>
        <p className="toolbar-hover-text">
          {this.state.hoverText}
        </p>
      </Fade>

      <div className="modify-acr-toolbar">

        <div className="toolbar-controls-container toolbar-section">

          <button
            onMouseOver={() => this.setHoverText("Select")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Select") |
              (this.props.selectButtonHandler && this.props.selectButtonHandler())
            }
            className={this.state.selectedButton === "Select" ? "selected-button" : ""}
          >
            <SelectPrimitiveIcon />
          </button>

          <button
            onMouseOver={() => this.setHoverText("Add")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Add") |
              (this.props.addPrimitiveHandler && this.props.addPrimitiveHandler())
            }
            className={this.state.selectedButton === "Add" ? "selected-button" : ""}
          >
            <AddPrimitiveIcon />
          </button>

          <button
            onMouseOver={() => this.setHoverText("Duplicate Selected")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Duplicate") |
              (this.props.duplicatePrimitiveHandler && this.props.duplicatePrimitiveHandler())
            }
            className={this.state.selectedButton === "Duplicate" ? "selected-button" : ""}
          >
            <DuplicatePrimitiveIcon />
          </button>

        </div>

        <div className="vertical-separator"></div>

        <div className="toolbar-navigation-container toolbar-section">
          <button
            onMouseOver={() => this.setHoverText("Generate Code")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Generate") |
              (this.props.generateCodeHandler && this.props.generateCodeHandler())
            }
            className={this.state.selectedButton === "Generate" ? "selected-button" : ""}
          >
            <GenerateCodeIcon />
          </button>

          <button
            onMouseOver={() => this.setHoverText("Back")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Back") |
              (this.props.goBackHandler && this.props.goBackHandler())}
            className={this.state.selectedButton === "Back" ? "selected-button" : ""}
          >
            <BackIcon />
          </button>

          <button
            onMouseOver={() => this.setHoverText("Help")}
            onMouseLeave={this.clearHoverText}
            onClick={() =>
              this.selectButton("Help") |
              (this.props.helpButtonHandler && this.props.helpButtonHandler())
            }
            className={this.state.selectedButton === "Help" ? "selected-button" : ""}
          >
            <HelpIcon />
          </button>
        </div>
      </div>

      <p style={{
        marginTop: '5px',
        marginLeft: 'auto',
        fontSize: '8px'
      }} className="toolbar-hover-text">
        {
          this.props.debugMode && this.props.absoluteMouse ? 
          `(${this.props.absoluteMouse.x}, ${this.props.absoluteMouse.y})`
          : ""
        }
        |
        {
          this.props.debugMode && this.props.canvasMouse ? 
          `(${this.props.canvasMouse.x}, ${this.props.canvasMouse.y})`
          : ""
        }
      </p>

      </div>
    );
  }
}
