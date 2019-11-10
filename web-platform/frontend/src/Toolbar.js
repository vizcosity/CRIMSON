/**
 * Toolbar component for interfacing with the InteractiveACRModifier component.
 *
 * @ Aaron Baw
 */

import React, { Component } from 'react';

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
  }

  render(){
    return (
      <div className="modify-acr-toolbar-container">

        <div className="toolbar-controls-container toolbar-section">
          <SelectPrimitiveIcon />
          <AddPrimitiveIcon />
          <DuplicatePrimitiveIcon />
        </div>

        <div className="vertical-separator"></div>

        <div className="toolbar-navigation-container toolbar-section">
          <GenerateCodeIcon />
          <BackIcon />
          <HelpIcon />
        </div>
      </div>
    );
  }
}
