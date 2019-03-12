/**
 * Module for generating synthetic data, such as input wireframes.
 *
 * @ Aaron Baw 2019
 */

 // Dependencies.
 const NodePyInt = require('../nodePyInt');
 const fs = require('fs');
 const mkdirp = require('mkdirp');
 const path = require('path');
 const rimraf = require('rimraf');
 const glob = require('glob');

 // Configuration.
 const _GENERATED_CONTAINER_DIR = path.resolve(__dirname, "../../../detection/test/containers");
 const _DRAW_CONTAINER_SCRIPT = path.resolve(__dirname, "../../../detection/test/draw.py");

// Given a serialised representation of the containers rectangles (upper right and
// bottom left vertices), converts this into an array conforming to the standard
// representation used throughout crimson: (UpperLeft, UpperRight, LowerRight, LowerLeft).
 const parseRectangles = path => {

   var rectangles = [];

   // All vertices, including trailing and leading parenthesis.
   var stringCords = path.split('.')[0].replace('[', '').replace(']', '').split(',');

   // Filter out parenthesis and parse as integers.
   var filteredCords = stringCords.map(cord => cord.replace(/[^0-9]/g, ''));
   var numCords = filteredCords.map(cord => parseInt(cord));

   // console.log(filteredCords, numCords);

   // Group vertices.
   for (var i = 0; i < numCords.length; i += 4){

     var x1 = numCords[i];
     var y1 = numCords[i+1];
     var x3 = numCords[i+2];
     var y3 = numCords[i+3];
     var dx = x3 - x1;
     var dy = y3 - y1;

     rectangles.push([
       [x1, y1], [x1, y1+dy], [x1 + dx, y1 + dy], [x1+dx, y1]
     ]);

   }

   return rectangles;

 };

 module.exports = {

    nestedContainerImage: (count) => new Promise((resolve, reject) => {

    if (!count) count = 10;

    // Clear the container directory prior to generating more samples.
    mkdirp.sync(_GENERATED_CONTAINER_DIR);
    rimraf(_GENERATED_CONTAINER_DIR, err => {
      if (err) return reject(err);
      mkdirp.sync(_GENERATED_CONTAINER_DIR);

      // Instantiate the Node-Python-Interface.
      var createContainers = NodePyInt(_DRAW_CONTAINER_SCRIPT,
        ['-c', count], {
          pythonCmd : 'python3',
          cwd: path.resolve(_GENERATED_CONTAINER_DIR, '../'),
          noThrow: true
        });

      createContainers().then(() => {

        // Collect all created container paths, and parse their vertices.
        glob(`${_GENERATED_CONTAINER_DIR}/*`, (err, paths) => {

          if (err) reject(`Could not read in containers in ${_GENERATED_CONTAINER_DIR}: ${err}`);

          paths = paths.map(p => Object({
            rectangles: parseRectangles(path.basename(p)),
            path: p
          }));

          return resolve(paths);

        });

      });


    })


   })
 }

 // module.exports.nestedContainerImage(10).then(console.log);
