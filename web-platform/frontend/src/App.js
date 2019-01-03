import React, { Component } from 'react';
import InteractiveACRModifier from './ModifyACR.js';
import ACRSample from './acr.json';
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import Landing from './Landing.js';
import logo from './logo.svg';
import 'semantic-ui-css/semantic.min.css';
import './App.css';
const Package = require('../package.json');


class App extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      navigate: {
        to: null,
        from: null,
        current: '/'
      }
    };
    this.project = {acr: ACRSample, source: {
      name: "Loading",
      url: `https://i.imgur.com/z0J73nL.png`
    }};
    this.onRecieveACRHandler = this.onRecieveACRHandler.bind(this);
  }

  // Called when the ACR object has been generated and recieved at the front
  // end. The acr is a JSON object, and so we can store this in cache and
  // move it around the application as needed.
  onRecieveACRHandler({acr, source}) {

    // Save it to the class instance.
    this.project = {acr, source};

    log(`New project instantiated.`, this.project);

    // Navigate to the ACR modifier module.
    this.setState({
      ...this.state,
      navigate: {
        to: '/modify-acr',
        from: this.state.navigate.current,
        current: '/modify-acr'
      }
    });

    // log(this.state);
    // log(this.project);

  }

  render() {
    return (
      <Router>

      <div className="routes-container" >

      {/* Navigate to other pages throughout the app. */}
      {this.state.navigate.to ? <Redirect from={this.state.navigate.from} to={this.state.navigate.to} /> : ""}

        <Route exact path="/" component={
          () => <Landing
          api={{
            generateCode: '/api/v1/generateCode',
            generateACR: '/api/v1/generateACR'
          }}
          onRecieveACR={this.onRecieveACRHandler}

          />
        } />
        <Route exact path="/modify-acr"
        render={
          () => <InteractiveACRModifier project={this.project}/>
        }
          />
      </div>
    </Router>);
  }
}

export default App;

// Logging
function log(...msg){
  console.log(`APP |`, ...msg);
}
