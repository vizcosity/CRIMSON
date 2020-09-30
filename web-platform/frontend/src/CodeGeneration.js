/**
 * Code generation UI.
 *
 * Takes in the ACR modified by the user, and returns generated code, displaying
 * it live for the user, and allowing the option to DownloadIcon the code as a
 * zipped project file.
 *
 * @ Aaron Baw 2018
 */

import React, { Component } from 'react';
import { DownloadIcon, ModifyIcon, DeployIcon } from './Icons';
import { OverlayButton } from './Asset';
import DeployDialogue from './Deploy';
import Modal from 'react-modal';
import fileDownload from 'js-file-download';
// import download from 'downloadjs';
import { Loader } from './Asset';
import { fetchGeneratedCode, fetchZippedBundle } from './Fetch.js';

class PreviewWindow extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      showDeployDialogue: this.props.oAuthToken ? true : false
    };

    console.log(`PreviewWindow | Recieved sessionID:`, this.props.sessionID);

  }

  showDeployDialogue(){
    this.setState({
      ...this.state,
      showDeployDialogue: true
    })
  }

  hideDeployDialogue(){
    this.setState({
      ...this.state,
      showDeployDialogue: false
    });

  }

  render(){
    return (
    <div style={{
      height: '100%'
    }}className="live-preview-container">
      <div className="overlay-buttons-container">
        <OverlayButton icon={<DownloadIcon />} text="Download" onClick={() =>
            // Fetch zip bundle.
            fetchZippedBundle(this.props.project.acr, {
              fileName: this.props.project.source.name,
              imgPath: this.props.project.source.path,
              context: 'vanilla',
              project: 'server'
            }).then(async (data) => {
              data = await data.blob();
              fileDownload(data, `${this.props.project.source.name}.zip`, 'application/zip');
            })} />
        <OverlayButton icon={<ModifyIcon />} text="Modify" onClick={() => this.props.history.push('/modify-acr')} />
        <OverlayButton icon={<DeployIcon />} text="Deploy" onClick={() => this.showDeployDialogue()} />
      </div>

      {
        /**
         * Deploy dialogue modal.
         */
      }
      <Modal style={{
        overlay: {
          display: 'flex'
        }
      }} className="deploy-dialogue dialogue-container" isOpen={this.state.showDeployDialogue}>
        <DeployDialogue
          onClose={() => this.hideDeployDialogue()}
          projectName={this.props.project.source.name}
          oAuthToken={this.props.oAuthToken}
          sessionID={this.props.sessionID}
        />
      </Modal>

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
      sessionID: this.props.sessionID || false,
      code: this.props.code || false,
      fileName: this.props.project.source.name,
      imgPath: this.props.project.source.path,
      context: 'vanilla',
      project: 'server',
      livePreview: true
    }).then(({url, sessionID, oAuthToken, acr, imagePath, fileName}) => {
      log(`Generated code. live at url:`, url, `with sessionID:`, sessionID);
      if (oAuthToken) log(`Recieved GitHub oAuthToken:`, oAuthToken);
      if (acr) this.props.project.acr = acr;
      if (fileName) this.props.project.source.name = fileName;
      if (imagePath) this.props.project.source.path = imagePath;
      this.onGenerateCodeHandler({url, sessionID, oAuthToken});
    });

    this.onGenerateCodeHandler = this.onGenerateCodeHandler.bind(this);
  }

  onGenerateCodeHandler({url, sessionID, oAuthToken}){

    // Save URL for use embedding within iFrame.
    this.generatedCodeUrl = url;
    this.sessionID = sessionID;
    this.oAuthToken = oAuthToken;

    console.log(`Code Generation | Recieved sessionID`, sessionID,`and oAuthToken`, oAuthToken);

    this.setState({
      ...this.state,
      sessionID: sessionID,
      loading: false
    });


  }

  render(){

    return (
      <div className="codegen-container">
      {
        this.state.loading ?

        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }} >
          <Loader text={`Generating code for ${this.props.project.source.name}`} />
        </div> :

        <PreviewWindow
          project={this.props.project}
          history={this.props.history}
          generatedCodeUrl={this.generatedCodeUrl}
          sessionID={this.sessionID}
          oAuthToken={this.oAuthToken}
        />

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
