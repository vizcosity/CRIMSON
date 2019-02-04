/**
 * Module containing functions to fetch data from the backend POST endpoint.
 *
 * @ Aaron Baw 2018
 */

import { api } from '../package.json';

// Given an acr object, context, and project type, generates the code and returns
// response from the server according to the desired format.
async function fetchGeneratedCode(acr, options){

  var data = new FormData();
  data.append('acr', JSON.stringify(acr));

  Object.keys(options).forEach(option => {
    data.append(option, options[option]);
  });

  var res = await fetch(api.generateCode, {
    method: 'POST',
    body: data
  });

  return res.json();

}

async function fetchZippedBundle(acr, options){
  options = {
    ...options,
    zip: true
  };
  var data = new FormData();
  data.append('acr', JSON.stringify(acr));

  Object.keys(options).forEach(option => {
    data.append(option, options[option]);
  });

  var res = await fetch(api.generateCode, {
    method: 'POST',
    body: data
  });

  return res;
}

export { fetchGeneratedCode, fetchZippedBundle };
