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
import { Download, Modify } from './Icons';
import fileDownload from 'js-file-download';
import download from 'downloadjs';
import { Dimmer, Loader } from 'semantic-ui-react'
import { fetchGeneratedCode, fetchZippedBundle } from './Fetch.js';

const OverlayButton = ({icon, text, onClick}) => <div onClick={onClick} className="overlay-button-container">
  {icon}
  <button className="overlay-button" >{text}</button>
</div>

class PreviewWindow extends Component {

  render(){
    return (
    <div style={{
      height: '100%'
    }}className="live-preview-container">
      <div style={{
        position: 'fixed',
        bottom: '0',
        right: '0'
      }} className="overlay-buttons-container">
        <OverlayButton icon={<Download />} text="Download" onClick={() =>
            // Fetch zip bundle.
            fetchZippedBundle(this.props.project.acr, {
              fileName: this.props.project.source.name,
              imgPath: this.props.project.source.path,
              context: 'vanilla',
              project: 'server'
            }).then(async (data) => {
              data = await data.blob();
              download(data, `${this.project.source.name}.zip`, 'application/zip');
            })} />
        <OverlayButton icon={<Modify />} text="Modify" onClick={() => this.props.history.push('/modify-acr')} />
      </div>
      <iframe title="live-codegen" className="live-preview" src={this.props.generatedCodeUrl} >
      </iframe>
    </div>
  );

  }

}

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
      project: 'server',
      livePreview: true
    }).then(({url}) => {
      log(`Generated code; live at url:`, url);
      this.onGenerateCodeHandler(url);
    });

    this.onGenerateCodeHandler = this.onGenerateCodeHandler.bind(this);
    this.requestBundleDownload = this.requestBundleDownload.bind(this);
  }


  requestBundleDownload(){
    // Request a zipped bundle from the server.

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

        <PreviewWindow project={this.props.project} history={this.props.history} generatedCodeUrl={this.generatedCodeUrl} />

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
