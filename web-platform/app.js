/**
 * REST API for generating ACR and source codes using CRIMSON.
 *
 * @ Aaron Baw 2018
 */

// Dependencies.
const dotenv = require('dotenv').config();
const express = require('express');
const session = require('express-session');
const dynamicMiddlewares = require('express-dynamic-middleware');
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
const createSubpathProxy = require('./modules/subpathProxy');
const crimson = require('crimson-inference');
const { getGitHubAuthToken, deployToGithub } = require('./deploy');
const config = require('crimson-inference/config/config.json');

// Keep track of running processes, ensuring to kill them once used.
var runningProcesses = {};
const getAvailablePort = (projectName) => {
  var portNum = 3500 + Object.keys(runningProcesses).length;
  return portNum;
}

// Instantiate dynamic middlewares.
const dynamic = dynamicMiddlewares.create();

// Defaults.
const _DEFAULT_OUTPUT_DIR = resolve(__dirname, './.generated');
const _FRONTEND_BUILD_DIR = resolve(__dirname, 'frontend/build');
const _PORT = process.env.PORT || (!process.env.PRODUCTION ? 3715 : 3000);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  secret: 'my secret',
  resave: null,
  saveUninitialized: null
}));

// Add dynamic middlewares for dynamically adding proxies as and when live previews
// of the site are needed.
app.use(dynamic.handle());

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

  // Check if the user is requesting a zip bundle.
  // if (req.body.zip && req.body.code == 'false'){
  //   if (!req.body.sessionID) return log(`No sessionID present in request for zipped bundle without acr / image wireframe.`);
  //   var outputDir = runningProcesses[req.body.sessionID].outputDir;
  //   log(`Generated zip file. Sending download from`, outputDir);
  //
  //   var zipFile = `${outputDir}/${fileName}/${fileName}.zip`;
  //   return res.download(zipFile);
  // }

  // If we have recieved a code from GitHub, then return the liveURL for the
  // running process, and return the oAuth token.
  if (req.body.code && req.body.code != 'false'){

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
    // Ensure that the 'server' project is selected by default - otherwise 'static' bundling is used, which is no longer supported.
    // TODO: Ensure that we entirely remove support for static bundling.
    project: req.body.project || "server",
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

    // Ensure that the 'LIVE_PREVIEW_MODE' env variable is set.
    process.env.LIVE_PREVIEW_MODE = true;


    var childServer = spawn(`node`, [join(outputDir, 'app.js'), getAvailablePort(fileName)], {
      // Ensure that we launch the child server with the SUBPATH_PREFIX env variable
      // set.
      env: { SUBPATH: sessionID, ...process.env }
    });

    runningProcesses[sessionID] = {
      process: childServer,
      outputDir,
      fileName,
      imagePath: req.body.imgPath,
      acr: req.body.acr
    };

    log(`Generated live preview. Waiting for url.`);

    childServer.stdout.on('data', data => {
      data = data.toString();
      log(`[${fileName} : Server]`, data);
      var urlMatches = data.match(/http\S+/g);
      if (urlMatches) {

        // Create a router path which proxies requests to the express server.
        // No need to open a port as the requests will be proxied before reaching
        // the firewall.

        // Pass in the dynamic middleware handle so that the proxy is added
        // dynamically to the app middleware.
        var subpath = createSubpathProxy(dynamic, urlMatches[0], sessionID);

        runningProcesses[sessionID].liveUrl = subpath;
        return res.json({
          url: subpath,
          sessionID
        });

        // Update running process details with the live url.
        // runningProcesses[sessionID].liveUrl = urlMatches[0];
        // return res.json({
        //   url: urlMatches[0],
        //   sessionID
        // });

    }
    });

    childServer.stdout.on('error', data => {
      log(`[ERROR] Could not launch child server:`, data.toString('utf8'));
      // return res.json({
      //   success: false,
      //   reason: 'Could not launch server.'
      // });
    });

    childServer.stderr.on('data', data => {
      log(`(ERROR) [${fileName} : Server]:`, data.toString('utf8'));
      // return res.json({
      //   success: false,
      //   reason: 'Could not launch server.'
      // });
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

// If the server is being run in production, serve the static files.
// Serve the static file by default if we are running in production mode.
if (process.env.PRODUCTION) {
  app.use(express.static(_FRONTEND_BUILD_DIR));
  app.get('*', (req, res, params) => {
    return res.sendFile(resolve(_FRONTEND_BUILD_DIR, 'index.html'));
  });
}


app.listen(_PORT, () =>
{
  log(`Listening on`, _PORT)
  if (process.env.SHAPE_DETECT_WEB_API_ENDPOINT)
    log(`Using Shape Detect Web API:`, process.env.SHAPE_DETECT_WEB_API_ENDPOINT);
  else
    log(`Using local Shape Detect API.`);
});

// Logging.
function log(...msg){
  if (process.env.DEBUG) console.log(basename(__filename.split('.')[0]).toUpperCase(), '|', ...msg);
}
