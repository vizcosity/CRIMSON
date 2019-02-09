/**
 * Module for handling deployment to GitHub & Heorku.
 *
 * @ Aaron Baw 2019
 */

const request = require('request-promise-native');
const glob = require('glob-promise');
const path = require('path');
const fs = require('fs');

const _GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const _GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const getGitHubAuthToken = async code => {
  return await request.post({
    url: 'https://github.com/login/oauth/access_token',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: _GITHUB_CLIENT_ID,
      client_secret: _GITHUB_CLIENT_SECRET,
      code
    })
  });

};

const createGithubRepo = async ({name, description, private=true, token}) => {

  return request.post({ method: 'POST',
  url: 'https://api.github.com/user/repos',
  headers:
   {
     'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
     'cache-control': 'no-cache',
     Authorization: `Bearer ${token}`,
     'Content-Type': 'application/json'
   },
  body:
   { name: name,
     description: description,
     // TODO: Update homepage with URL from heroku.
     homepage: 'https://github.com',
     private: private,
     has_issues: true,
     has_projects: true,
     has_wiki: true },
  json: true });

};

const commitFileToRepo = async ({repo, user, file, token, message}) => {
  log(`Committing:`, file,`to`, repo);
  return request({
    method: 'PUT',
    url: `https://api.github.com/repos/${user.name}/${repo}/contents/${file.path}`,
    headers:
    {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
      'cache-control': 'no-cache',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body:
     { message: message,
       committer: { name: user.name, email: user.email},
       content: file.contentHash },
    json: true
  })
}

// Commits each file in the 'file' array to the github repo for the user specified.
// files: [filepath,...]
// user: {name, email}
const commitFilesToRepo = async ({repo, user, message=`Init commit`, token, files}) => {

  var toCommit = [];

  // Read in files for array passed.
  files.forEach(filePath => {
    log(`Reading:`, filePath);
    var contentHash = fs.readFileSync(path.resolve(filePath.absolute)).toString('base64');
    var name = path.basename(filePath.absolute);
    toCommit.push({
      path:filePath.relative, contentHash
    });
  });

  // Commit each file.
  for (var i = 0; i < toCommit.length; i++){
    var file = toCommit[i];
    log(`Committing`, file.path, `to`, repo);
    await commitFileToRepo({repo, user, file, token, message});
  }

};

// Commits a directory to the repo specified.
const commitDirToRepo = async ({repo, user, message=`Init commit`, token, projectDir}) => {

  var projectName = path.basename(projectDir);

  // Get all the files in the project dir recursively, and find their relativePaths.
  log(`Collecting files from`, path.join(projectDir, '/**'));
  var files = await glob(path.join(projectDir, '/**/*.*'));
  files = files.map(filePath => Object({
    absolute: filePath,
    relative: path.relative(projectDir, filePath)
  }));

  log(`Collected files:`, files);

  // Commit files to repo.
  return commitFilesToRepo({repo, user, message, token, files});

};

const deployToGithub = async ({
  description,
  private=true,
  token,
  repo,
  user,
  message=`Init commit`,
  configureForHeroku=true,
  projectDir
}) => {
  var repoDetails = await createGithubRepo({name:repo, description, private, token});
  log(`Created GitHub Repo:`, repoDetails);
  log(`Uploading files.`);

  // Assign placeholder email if user object not passed.
  // TODO: Enter CRIMSON email so that we can see how many
  // sites have been created with CRIMSON.
  if (!user){
    user = {
      name: repoDetails.owner.login,
      email: 'aaronbaw@gmail.com'
    }
  }

  await commitDirToRepo({repo, user, message, token, projectDir});
  log(`Configuring repo for Heroku.`);
  await configureRepoForHeroku({user, repoURL: repoDetails.svn_url, name: repo, token, description});
  log(`Done.`);
  return repoDetails;
};

// Heroku projects need an app.json file which specifies the buildpack, as well
// as a procfile which launches the dyno.
const configureRepoForHeroku = async ({user, repoURL, name, token, description}) => {

  var AppFile = `{
    "name": "${name}",
    "description": "${description}",
    "repository": "${repoURL}",
    "buildpacks": [
      {
        "url": "https://github.com/heroku/heroku-buildpack-nodejs.git"
      }
    ],
    "logo": "https://rawgit.com/heroku/node-js-sample/master/public/node.svg",
    "keywords": ["node", "express"]
  }`;

  var procfile = 'web: npm start';

  var files = [
    {
      contentHash: new Buffer(AppFile).toString('base64'),
      path: 'app.json'
    },
    {
      contentHash: new Buffer(procfile).toString('base64'),
      path: 'procfile'
    }
  ];

  for (var i = 0; i < files.length; i++)
    await commitFileToRepo({repo: name, file: files[i], message: `Configuring repo for Heroku deployment`, user, token});

};

function log(...msg){
  if (process.env.DEBUG) console.log(`DEPLOY |`, ...msg);
}

module.exports = {
  getGitHubAuthToken, createGithubRepo, commitFilesToRepo, commitDirToRepo, deployToGithub, configureRepoForHeroku
};
