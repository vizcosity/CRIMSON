/**
 * Module containing functions to fetch data from the backend POST endpoint.
 *
 * @ Aaron Baw 2018
 */

import { api } from '../package.json';
import { sortShapes } from './geometry';

// Given an acr object, context, and project type, generates the code and returns
// response from the server according to the desired format.
async function fetchGeneratedCode(acr, options){

  // Sort shapes before generating code in case user has altered the ordering.
  acr = sortShapes(acr);

  console.log('Sorted ACR:', acr);

  var data = new FormData();
  data.append('acr', JSON.stringify(acr));

  Object.keys(options).forEach(option => {
    data.append(option, options[option]);
  });

  var res = await fetch(api.generateCode, {
    method: 'POST',
    credentials: 'same-origin',
    body: data
  });

  return res.json();

}

async function fetchZippedBundle(acr, options){
  options = {
    ...options,
    code: false,
    zip: true
  };
  var data = new FormData();
  data.append('acr', JSON.stringify(acr));

  Object.keys(options).forEach(option => {
    data.append(option, options[option]);
  });

  var res = await fetch(api.generateCode, {
    method: 'POST',
    credentials: 'same-origin',
    body: data
  });

  return res;
}

async function deployToGithub (options){

  console.log(`FETCH | Deploying`, options);

  var res = await fetch(api.deployToGithub, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(options)
  });

  return res;
}

export { deployToGithub, fetchGeneratedCode, fetchZippedBundle };
