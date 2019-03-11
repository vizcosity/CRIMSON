/**
 * Landing page allowing users to drag and drop their image to be
 * converted into code.
 *
 * @ Aaron Baw 2018
 *
 */

import React, { Component } from 'react';
import { LandingBackground, Loader } from './Asset';
import { UploadIcon } from './Icons';
import { Fade } from 'react-reveal';
import FileDrop from 'react-file-drop';

const Footer  = () => <footer>
  <p>CRIMSON @ Aaron Baw 2018</p>
</footer>

// Reads a file, returning the URL.
const readFile = file => new Promise((resolve, reject) => {
  var reader = new FileReader();
  reader.onload = e => {
    return resolve(e.target.result);
  }
  reader.readAsDataURL(file);
});

class Uploader extends Component {
  constructor(props, context){
    super(props, context);

    this.state = {
      selectedFile: null
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onUploadHandler = this.onUploadHandler.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  handleInputChange(e){
    this.setState({
      selectedFile: e.target.files[0]
    }, () => this.onUploadHandler());
  }

  openFileDialogue(){

  }

  onUploadHandler(){

    // If no file has been selected, force user to select one.
    if (!this.state.selectedFile) return this.inputRef.click();

    if (this.props.onStartUpload) this.props.onStartUpload();

    const data = new FormData();
    data.append('wireframe', this.state.selectedFile, this.state.selectedFile.name);
    data.append('context', 'vanilla');
    data.append('zip', true);

    fetch(this.props.apiUrl, {
      method: 'POST',
      body: data
    }).then(async res => {
      res = await res.json();
      log(this.state.selectedFile);
      log(`Recieved`, res, `from server.`);
      // download(res, this.state.selectedFile.name.split('.')[0]+'.zip');
      if (this.props.onEndUpload) this.props.onEndUpload({acr:res.acr, source: {
        name: this.state.selectedFile.name,
        data: await readFile(this.state.selectedFile),
        ...res.file
      }});

    });

  }

  handleDrop(files, event){

    this.setState({
      ...this.state,
      selectedFile: files[0]
    }, () => this.onUploadHandler());
  }

  render(){
    return (

      <div className={`${this.state.selectedFile ? "uploader-active" : ""} uploader-container`}>
      <FileDrop draggingOverFrameClassName="uploader-hover" onDrop={this.handleDrop}>
        <input ref={inputRef => this.inputRef = inputRef} className="file" onChange={this.handleInputChange} type="file" />
        <button className="button-fade" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: "center",
          justifyContent: "center"
        }} onClick={this.onUploadHandler}>
          <UploadIcon />
          <p
          className={this.state.selectedFile ? "uploader-active" : ""}
          style={{
            marginTop: '10px',
            fontFamily: '"Futura", sans-serif'
          }} > {this.state.selectedFile ? this.state.selectedFile.name : "Upload"} </p>
        </button>
        </FileDrop>
      </div>

    );
  }
}

export default class Landing extends Component {

  constructor(props, context){
    super(props, context);

    this.state = {
      loading: false
    };

    this.onEndUpload = this.onEndUpload.bind(this);
    this.onStartUpload = this.onStartUpload.bind(this);
  }

  // Hide the spinner & return the onRecieveAcr function.
  onEndUpload(params){

    this.setState({
      ...this.state,
      loading: false
    })

    return this.props.onRecieveACR(params);
  }

  onStartUpload(){
    this.setState({
      ...this.state,
      loading: true
    });
  }


  render(){
    return (
      <div className="landing-page-container">

      <Fade when={!this.state.loading}>

      <div style={{
      }} className="vertical-panel">

      <div className="landing-headers-container">
        <h1>crimson</h1>
        <h2>An intelligent tool for rapid prototyping on the web.</h2>
      </div>

      </div>

      <div className="vertical-panel">
        <Uploader
          apiUrl={this.props.api.generateACR}
          onStartUpload={this.onStartUpload}
          onEndUpload={this.onEndUpload}
        />
      </div>

      </Fade>

      <Fade when={this.state.loading}>
        <Loader style={{
          left: `calc(50% - ${152.36/2}px)`
        }} text="Detecting symbols."/>
      </Fade>
        <Footer />
        <LandingBackground />
      </div>
    );
  }

}

function log(...msg){
  console.log(`Landing |`, ...msg);
}
