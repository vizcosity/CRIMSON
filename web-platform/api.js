/**
 * REST API for generating ACR and source codes using CRIMSON.
 *
 * @ Aaron Baw 2018
 */

// Dependencies.
const dotenv = require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const mkdir = require('mkdirp').sync;
const { exec, spawn } = require('child_process');
const package = require('./package.json');
const endpointPrefix = `/api/v${package['api-version']}`;
const multer = require('multer');
const { resolve, basename, extname, join } = require('path');
const crypto = require('crypto');
const upload = multer({
  dest: resolve(__dirname, "./.uploads"),
  preservePath: true,
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './.uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + extname(file.originalname))
    }
  })
});
const crimson = require('crimson-inference');
const { getGitHubAuthToken, deployToGithub } = require('./deploy');
const config = require('crimson-inference/config/config.json');

// Keep track of running processes, ensuring to kill them once used.
var runningProcesses = {};
const getAvailablePort = (projectName) => {
  var portNum = 3500 + Object.keys(runningProcesses).length;
  return portNum;
}

// Defaults.
const _DEFAULT_OUTPUT_DIR = resolve(__dirname, './.generated');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'my secret',
  resave: null,
  saveUninitialized: null
}));

// Session handling.
// Generate a random sessionID.
const generateSessionID = (projectName) => {
  var hash = crypto.randomBytes(12).toString('hex').slice(0, 12).toString('hex');
  return `${projectName}_${hash}`;
};


// Register GET point to fetch list of supported primitives.
app.get(`${endpointPrefix}/getSupportedPrimitives`, (req, res, params) => {
  return res.json(config.supportedPrimitives);

});

// Register a POST endpoint for generating the ACR.
app.post(`${endpointPrefix}/generateACR`, upload.single('wireframe'), async (req, res, params) => {

  // Assign a new session id.
  var fileName = req.body.fileName ? req.body.fileName : basename(req.file.originalname).split('.')[0];
  req.session.id = generateSessionID(fileName);

  if (!req.file) return res.json({success: false, error: "No file provided."});

  // req.file['wireframe'].path contains path to the uploaded image wireframe.
  // req.body contains the other text fields which may be included.
  var imgPath = req.file.path;

  try {
    // Generate the ACR.
    var acr = await crimson.generateACR(resolve(__dirname, imgPath));
  } catch(e){
    res.json({success: false, error: e});
  }
  // Send ACR as response.
  res.json({acr, file: req.file});
});

// Register POST endpoint to generate code from ACR representation.
// Given an image and/or ACR representation, generates the source codes
// the given options, and returns a zip file with the generated project,
// as well as a live URL with the generated page, if desired.
app.post(`${endpointPrefix}/generateCode`, upload.single('wireframe'), async (req, res, params) => {

  // Assign new session ID if it doesn't exist.
  // if (!req.session.id) {
  //   // Assign a new session.
  //   var fileName = req.body.fileName ? req.body.fileName : basename(req.file.originalname).split('.')[0];
  //   req.session.id = generateSessionID(fileName);
  // } else if (runningProcesses[req.session.id])
  //
  //   // Check if we have recieved a GitHub auth code in the params.
  //   if (req.body.code)
  //
  //   return res.json({
  //     url: runningProcesses[req.session.id].liveUrl
  // });

  // If we have recieved a code from GitHub, then return the liveURL for the
  // running process, and return the oAuth token.
  if (req.body.code != 'false'){

    log(`Recieved callback from GitHub with code`, req.body.code, `and sessionID`, req.body.sessionID);

    if (!req.body.sessionID) return res.json({
      success: false,
      reason: "No sessionID present in request. Check GitHub redirect URI."
    });

    // Grab the GitHub Auth token & liveURL.
    var oAuthTokenResponse = JSON.parse(await getGitHubAuthToken(req.body.code));
    var project = runningProcesses[req.body.sessionID]
    var liveURL = project.liveUrl;

    log(`Returning oAuthToken Response:`, oAuthTokenResponse, `and liveURL:`, liveURL);

    return res.json({
      url: liveURL,
      sessionID: req.body.sessionID,
      oAuthToken: oAuthTokenResponse.access_token,
      ...project
    })
  }



  // If an image is passed to the request, it will be stored under the
  // req.file field.
  // If no ACR is passed, then we generate it from the image passed.
  if (req.file && !req.body.acr){
    try {
      req.body.acr = await crimson.generateACR(resolve(__dirname, req.file.path));
    }catch(e){
      return res.json({success: false, error: e});
    }
  } else if (req.body.acr) req.body.acr = JSON.parse(req.body.acr);

  if (!req.body.acr) return res.json({success: false, error: "No ACR or image file passed."});
  if (!req.body.fileName && !req.file) return res.json({success: false, error: "'fileName' field must be passed with ACR object."});

  var fileName = req.body.fileName ? req.body.fileName : basename(req.file.originalname).split('.')[0];
  log(`Generating code for`, fileName);
  log(`Image Path for`, fileName, `:`, req.body.imgPath);

  var sessionID = generateSessionID(fileName);

  // Generate the codes and return the output directory.
  var outputDir = await crimson.generateCode(req.body.acr, {
    fileName: fileName,
    context: req.body.context,
    file: req.file ? req.file.originalname : null,
    imgPath: req.body.imgPath ? req.body.imgPath : (req.file ? req.file.path : null),
    outputDir: function(){
      var projectDir = _DEFAULT_OUTPUT_DIR + '/' + fileName;
      mkdir(projectDir);
      return projectDir;
    }(),

    // Other params should include the context, project type
    // and output directory.
    ...req.body
  });

  log(`Output directory for generated code`, outputDir);

  // Launch a live webserver if the param has been passed.
  if (req.body.livePreview == 'true'){

    var childServer = spawn(`node`, [join(outputDir, 'app.js'), getAvailablePort(fileName)]);
    runningProcesses[sessionID] = {
      process: childServer,
      outputDir,
      fileName,
      acr: req.body.acr
    }

    log(`Generated live preview. Waiting for url.`);

    childServer.stdout.on('data', data => {
      data = data.toString();
      log(`[${fileName} : Server]`, data);
      var urlMatches = data.match(/http\S+/g);
      if (urlMatches) {
        // Update running process details with the live url.
        runningProcesses[sessionID].liveUrl = urlMatches[0];
        return res.json({
          url: urlMatches[0],
          sessionID
        });
    }
    });
  }

  // Return zipped file.
  else if (req.body.zip){
    log(`Generated zip file. Sending download from`, outputDir);
    // The outputDir does not contain the name of the project directory, this needs
    // to be included alongside the actual zip file itself.
    var zipFile = `${outputDir}/${fileName}/${fileName}.zip`;
    return res.download(zipFile);
  }

});

// Set up endpoint to deploy project to GitHub.
app.post(`${endpointPrefix}/deployToGithub`, async (req, res, params) => {

  log(`Recieved request to deploy to Github for repo:`, req.body);

  if (!req.body.token || !runningProcesses[req.body.sessionID]) return res.json({
    success: false,
    error: "Missing params."
  });

  var projectDir = runningProcesses[req.body.sessionID].outputDir;

  log(`Deploying ${req.body.repoName} to GitHub.`);

  try {
    var repo = await deployToGithub({
      user: req.body.user,
      description: req.body.repoDesc || "Sample webpage built with CRIMSON.",
      private: req.body.privateOption || true,
      token: req.body.token,
      repo: req.body.repoName,
      message: req.body.message || `Init commit`,
      projectDir
    });
  } catch (e){
    log(`Could not deploy ${req.body.repoName} to GitHub:`,e.body);
    return res.json({
      success: false,
      reason: `Could not create repository: ${e}`
    })
  }

  log(`Created and deployed`,req.body.repoName, `to GitHub Repository:`, repo.svn_url);

  return res.json({
    success: true,
    ...repo
  });

});


app.listen(process.env.PORT ? process.env.PORT : 3715, () => log(`Listening on`,
process.env.PORT ? process.env.PORT : 3715));

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
