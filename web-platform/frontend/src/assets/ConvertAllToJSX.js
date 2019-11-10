/**
 * Script to convert all files in this folder to JS Components.
 */

const HTMLtoJSX = require('htmltojsx');
const fs = require('fs');
const path = require('path');

const classTemplate = `
import React, { Component } from 'react';

export default class $component$ extends Component {

  constructor(props, context){
    super(props, context);
  }

  componentDidMount(){
    if (this.props.getRef) this.props.getRef(this.ref);
  }

  render(){
    return (
      $code$
    );
  }
}`;

const converter = new HTMLtoJSX({
  createClass: false
});


const getSVGFilesInDir = () => new Promise((resolve, reject) => {

  fs.readdir(__dirname, (err, files) => {
    if (err) reject(err);

    resolve(files.filter(file => file.split('.').length > 1 && file.split('.')[1].toLowerCase().indexOf('svg') !== -1));

  })
});

const createJSModuleText = (svg, componentName) => {
  var jsx = converter.convert(svg);

  // Strip erroneous xml comment at the top of the SVG if present.
  var matched = jsx.match(/<svg(.|\n)*?<\/svg>/g)[0];

  // Ensure we can pass props to the component.
  matched = matched.replace('<svg', '<svg {...this.props} ref={ref => this.ref = ref}');

  var componentString = classTemplate.replace('$component$', componentName);

  componentString = componentString.replace('$code$', matched);

  return componentString;
}

const createModule = (filePath) => new Promise((resolve, reject) => {

  // console.log('creating module for', filePath);

  fs.readFile(path.join(__dirname, filePath), (err, data) => {

    // console.log('read file');

    if (err) return reject(err);

    data = data.toString('utf8');

    var fileName = path.basename(filePath);
    var componentName = path.basename(fileName).replace(path.extname(fileName), '');

    var componentCode = createJSModuleText(data, componentName);

    var fileToWritePath = path.join(path.dirname(filePath), `${componentName}.js`);

    fs.writeFile(path.join(__dirname, fileToWritePath), componentCode, (err) => {
      if (err) return reject(err);
      console.log("Created module for", componentName);
      return resolve();
    })

  });

});

const main = async () => {

  var files = await getSVGFilesInDir();

  var promises = files.map(file =>
    createModule(file)
  );

  return Promises.all(promises);
  
}

main();
