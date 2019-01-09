/**
 * Code generation UI.
 *
 * Takes in the ACR modified by the user, and returns generated code, displaying
 * it live for the user, and allowing the option to download the code as a
 * zipped project file.
 *
 * @ Aaron Baw 2018
 */

import React, { Component } from 'react';
import { Dimmer, Loader, Segment } from 'semantic-ui-react'
import { fetchGeneratedCode } from './Fetch.js';

class CodeGenerator extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      loading: true
    };

    // Fetch generated code.
    fetchGeneratedCode(this.props.project.acr, {
      fileName: this.props.project.source.name,
      imgPath: this.props.project.source.path,
      context: 'vanilla',
      project: 'static',
      livePreview: true
    }).then(({url}) => {
      log(`Generated code; live at url:`, url);
      this.onGenerateCodeHandler(url);
    });

    this.onGenerateCodeHandler = this.onGenerateCodeHandler.bind(this);

  }

  onGenerateCodeHandler(url){

    // Save URL for use embedding within iFrame.
    this.generatedCodeUrl = url;

    this.setState({
      ...this.state,
      loading: false
    });


  }

  render(){

    return (
      <div className="codegen-container">
      {
        this.state.loading ?

        <div className="loading-container">
          <Dimmer active inverted>
          <Loader active indeterminate inverted>Generating code for {this.props.project.source.name}</Loader>
          </Dimmer>
        </div> :

        <iframe className="live-preview" src={this.generatedCodeUrl} ></iframe>
      }
      </div>
    );

  }
}

export default CodeGenerator;

// Logging.
function log(...msg){
  console.log(`CODE GEN |`, ...msg);
}
