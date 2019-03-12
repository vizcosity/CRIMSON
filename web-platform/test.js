/**
 *  Unit Testing framework for SEARLE.
 */

// DEPENDENCIES
const assert = require('assert');
const {spawn} = require('child_process');
const path = require('path');
const request = require('request');
const package = require('./package');
const fs = require('fs');
const crimson = require('crimson-inference');
const config = require('crimson-inference/config/config');

const _ENDPOINTPREFIX = `/api/v${package['api-version']}`;
const _SUPPORTED_PRIMITIVES = config.supportedPrimitives;
const _SAMPLE_WIREFRAME_IMAGE = path.resolve('../inference/images/benchmark.png');
const _SAMPLE_WIREFRAME_ACR = require('crimson-inference/.output/benchmark/acr.json');
const _SAMPLE_CARD_PRECOMPOUND_ACR = [{
  id: 0,
  type: "container",
  contains: [
    {id: 1, type: "image", contains: []},
    {id: 2, type: "header", contains: []},
    {id: 3, type: "paragraph", contains: []}
  ]
}];

const getURI = endpointName => {
  return `http://localhost:3715${_ENDPOINTPREFIX}/${endpointName}`;
};

const isEqual = (first, second) => {

  if (typeof first !== 'object') return first === second;

  if (Object.keys(first).length !== Object.keys(second).length) return false;

  for (key in first){
      if (!isEqual(first[key], second[key])) return false;
  }

  return true;

};

// Flattens ACR tree into a single array, ignoring hierarchies.
const flattenACR = acr => {
  if (Array.isArray(acr)) return acr.reduce((acc, curr) => acc.concat(flattenACR(curr)), []);
  else return [{...acr, contains: []}].concat(flattenACR(acr.contains));
}

describe('[CORE] Regression Testing', () => {
  it('Outputs correct ACR for a sample wireframe', (done) => {
    crimson.generateACR(_SAMPLE_WIREFRAME_IMAGE).then(acr => {
      if (!isEqual(acr, _SAMPLE_WIREFRAME_ACR)) throw "ACR does not match expected.";
      else done();
    });
  });

  it('Correctly identifies the positions with an accuracy of 0.95 iou or greater, and less than 1 pixel error ', () => new Promise(async (resolve, reject) => {

    // Generate synthetic data by creating random containers.
    var wireframes = await crimson.nestedContainerImage(1);

    for (var i = 0; i < wireframes.length; i++){
      var wireframe = wireframes[i];
      var acr = await crimson.generateACR(wireframe.path);
      var detectedRectangles = flattenACR(acr).map(shape => shape.meta.vertices);
      // console.log(detectedRectangles, wireframe.rectangles);
      assert.equal(detectedRectangles.length, wireframe.rectangles.length);

      detectedRectangles.forEach((rectangle, i) => {
        rectangle.forEach((vertex, j) => {
          vertex.forEach((dimension, k) => {
            var error = Math.abs(wireframe.rectangles[i][j][k] - dimension);
            var iou = crimson.calcIou(rectangle, wireframe.rectangles[i]);
            assert.equal(error <= 1 && iou >= 0.95, true);
          })
        })
      })
    }

    resolve();

  }));

});

describe('[CORE] Unit Testing', () => {
  it('Should generate ACR from a sample wireframe', (done) => {
    crimson.generateACR(_SAMPLE_WIREFRAME_IMAGE).then(acr => done());
  });

  it('Should detect base primitives in an image (unprocessed ACR)', (done) => {
    crimson.detectPrimitives(_SAMPLE_WIREFRAME_IMAGE).then(primitives => done());
  });

  it('Should mark primitives to be visualised in the web platform', (done) => {
    crimson.detectPrimitives(_SAMPLE_WIREFRAME_IMAGE).then(primitives => {
      var marked = crimson.markDisplayablePrimitives(primitives);
      flattenACR(marked).forEach(primitive => {
        if (_SUPPORTED_PRIMITIVES.indexOf(primitive.type) !== -1 && !primitive.draw)
          throw `${primitive.type} should be drawn.`;
      });
      done();
    });
  });

  it('Should filter unwanted primitives prior to inference', (done) => {
    var containingUnwanted = _SAMPLE_WIREFRAME_ACR.concat([{
      "id": "196",
      "type": "intersection",
      "meta": {
        "absoluteWidth": 0,
        "absoluteHeight": 0,
        "relativeWidth": "100.0%",
        "relativeHeight": "100.0%",
        "midpoint": [
          13,
          95
        ],
        "area": 0,
        "vertices": [
          [
            13,
            95
          ]
        ]
      },
      "level": 3,
      "contains": []
    }]);

    var filtered = crimson.filterPrimitives(containingUnwanted);

    if (!isEqual(filtered, _SAMPLE_WIREFRAME_ACR)) throw "Intersection was not filtered prior to inference."
    done();

  });

  it('Should correctly classify container with image, header & paragraph as a card', (done) => {
    var compoundPrimitives = crimson.inferCompoundPrimitivesAtLevel(_SAMPLE_CARD_PRECOMPOUND_ACR);
    if (compoundPrimitives[0].type !== 'card_image_text') throw `Primitive incorrectly classified as ${compoundPrimitives[0].type} instead of card_image_text.`;
    done();
  });

});

describe('[API] Integration Testing', () => {

    it('Should return the correct list of supported primitives.', (done) => {
      request.get(getURI('getSupportedPrimitives'), (err, options) => {
          if (err) throw err;
          var primitives = JSON.parse(options.body);
          primitives.forEach((primitive, i) => {
            assert.equal(primitive, _SUPPORTED_PRIMITIVES[i]);
          });
          done();
        });
      });

      it('Should generate ACR for a sample wireframe', (done) => {
        var req = request.post(getURI('generateACR'), function (err, resp, body) {
          if (err) throw err;
          if (JSON.parse(body)) done();
        });

        var form = req.form();
        form.append('wireframe', fs.readFileSync(_SAMPLE_WIREFRAME_IMAGE), {
          filename: 'benchmark.png',
          contentType: 'image/png'
        });

        form.append('fileName', 'benchmark.png');
      });

      it('Should generate a live preview url from ACR', (done) => {
        var req = request.post(getURI('generateCode'), function (err, resp, body) {
          if (err) throw err;
          body = JSON.parse(body);
          if (body.url) done();
          else throw body.error;
        });

        var form = req.form();

        form.append('acr', JSON.stringify(_SAMPLE_WIREFRAME_ACR));
        form.append('fileName', 'benchmark.png');
        form.append('context', 'vanilla');
        form.append('project', 'server');
        form.append('code', 'false');
        form.append('livePreview', 'true');

      });

      it('Should generate a live preview url from a sample wireframe', (done) => {
        var req = request.post(getURI('generateCode'), function (err, resp, body) {
          if (err) throw err;
          body = JSON.parse(body);
          if (body.url) done();
          else throw body.error;
        });

        var form = req.form();

        form.append('fileName', 'benchmark.png');
        form.append('wireframe', fs.readFileSync(_SAMPLE_WIREFRAME_IMAGE), {
          filename: 'benchmark.png',
          contentType: 'image/png'
        });
        form.append('context', 'vanilla');
        form.append('project', 'server');
        form.append('code', 'false');
        form.append('livePreview', 'true');

      });

      it('Should generate a zipped bundle from a sample wireframe', (done) => {
        var req = request.post(getURI('generateCode'), function (err, resp, body) {
          if (err) throw err;
          // body = JSON.parse(body);
          // console.log(body);
          // if (body.url) done();
          // else throw body.error;
          done();
        });

        var form = req.form();

        form.append('acr', JSON.stringify(_SAMPLE_WIREFRAME_ACR));
        form.append('fileName', 'benchmark.png');
        form.append('context', 'vanilla');
        form.append('project', 'server');
        form.append('code', 'false');
        form.append('zip', 'true');

      });

});



// Return a specified amount of random elements from the array passed.
function randomElements(array, limit){
  if (!limit) return array;

  var output = [];
  while (output.length < limit)
    output.push(array[Math.floor(Math.random() * array.length)]);

  return output;
}
