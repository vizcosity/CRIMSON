/**
 * Landing page allowing users to drag and drop their image to be
 * converted into code.
 *
 * @ Aaron Baw 2018
 *
 */

import React, { Component } from 'react';
import { HashLoader } from 'react-spinners';
import { Fade } from 'react-reveal';

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
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onUploadHandler = this.onUploadHandler.bind(this);
  }

  handleInputChange(e){
    this.setState({
      selectedFile: e.target.files[0]
    })
  }

  onUploadHandler(){

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

  render(){
    return (

      <div className="uploader-container">
        <input onChange={this.handleInputChange} type="file" />
        <button onClick={this.onUploadHandler}>Upload</button>
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

    return this.props.onRecieveACRHandler(params);
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

      <Fade collapse when={!this.state.loading}>
      <div className="landing-headers-container">
        <h1>CRIMSON</h1>
        <h2>An intelligent tool for rapid prototyping on the web.</h2>
      </div>

        <Uploader
          apiUrl={this.props.api.generateACR}
          onStartUpload={this.onStartUpload}
          onEndUpload={this.onEndUpload}
        />

    </Fade>

      <Fade collapse when={this.state.loading}>
      <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      className="loading-container">
        <HashLoader
          sizeUnit={"px"}
          size={50}
          color={'#DEE3EB'}
      />
      <h3 style={{
        marginTop: '15px'
      }}> Detecting symbols. </h3>
      </div>
      </Fade>

        <Footer />
      </div>
    );
  }

}

function log(...msg){
  console.log(`Landing |`, ...msg);
}
