/**
 * Components for actions and UI needed for deployment.
 *
 * This involves presenting the user with a modal and various options they
 * may choose to set for deployment, as well as handling of obtaining an
 * OAuth token from GitHub for committing the project files.
 *
 * @ Aaron Baw 2019
 */


// TODO:
// 1). Set options for user customisation (e.g. private repo, name & desc).
// 2). Embed a session identifier so that we return to this page on callback.
//      - Add 'code' param.
//      - Ensure that we check for this, and display the DeployDialogue automatically
//        upon returning to the screen.
// 3). Implement session identifiaction on the backend to return this page on
//     callback.

import React, { Component } from 'react';
import { Fade } from 'react-reveal';
import { BarLoader } from 'react-spinners';
import { deployToGithub } from './Fetch';
import { CloseIcon } from './Icons';


// Display GitHub repository URL as well as button to deploy to heroku.
const PostGitHubDeployActions = ({repo}) => <div>
  <p className="success" style={{
    textAlign: 'center',
  }}>Your GitHub repository has been published to:</p>
  <input style={{

    width: '-webkit-fill-available',
    margin: '10px 0px 10px 0px'

  }} readOnly value={repo.url} />

  <p className="subtext">Now that {repo.name} has been published, you can deploy your project to
  Heroku and obtain a live URL that you can share. </p>
  <div className="horizontal-container">
    <a target="_blank" href={`https://heroku.com/deploy?template=${repo.url}`}>
      <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy To Heroku" />
    </a>
  </div>

</div>

const DeployingIndicator = () => <div className="vertical-container">
<BarLoader
  sizeUnit={"px"}
  size={20}
  color={'#DEE3EB'}
/>
<p style={{
  marginTop: '5px',
  color: '#DEE3EB'
}} className="subtext">Deploying to Github...</p>
</div>

class GitHubDeployActions extends Component {
  constructor(props, context){
    super(props, context);
  }

  render(){
    return (
      <div className="horizontal-container">

      {
        !this.props.oAuthToken ?
        <a
          href={
            `https://github.com/login/oauth/authorize?client_id=${
              '3e8945e0b4ea2aaee682'
            }&scope=${
              'repo'
            }&redirect_uri=${
              'http://localhost:3000/generate-code?sessionID='+this.props.sessionID
            }`
          }
          onClick={this.props.handleGithubAuth}
        >Connect to Github</a>
        :  <p className="success">Connected ✔</p>
      }
      {
        /**
         * Disable the button until the component recieves an oAuth token.
         */
      }
      <button
        onClick={this.props.handleDeploy}
        disabled={!this.props.oAuthToken}
      >Deploy</button>
      </div>
    );
  }
}


class DeployDialogue extends Component {
  constructor(props, context){
    super(props, context);

    this.state = {
      repo: {
        name: this.props.projectName,
        desc: "My sketched website!"
      }
    }

    console.log(`Deploy Dialogue | Recieved sessionID`, this.props.sessionID, `and oAuthToken`, this.props.oAuthToken);

    this.handleDeploy = this.handleDeploy.bind(this);
  }

  handleDeploy(){

    // Set state to indicate that deployment is pending.
    this.setState({
      ...this.state,
      awaitingDeployment: true
    })

    console.log(`Deploy Dialogue | Deploying ${this.state.repo.name} to GitHub.`);
    deployToGithub({
      repoName: this.state.repo.name,
      repoDesc: this.state.repo.desc,
      privateOption: this.state.repo.private,
      sessionID: this.props.sessionID,
      token: this.props.oAuthToken
    }).then(async createdRepo => {
      createdRepo = await createdRepo.json();
      console.log(`DEPLOY | Recieved deployment response:`, createdRepo);
      if (!createdRepo.success) this.notifyDeploymentError(createdRepo.message);
      else
        this.setState({
          ...this.state,
          repo: {
            ...this.state.repo,
            ...createdRepo,
            url: createdRepo.svn_url
          }
        });
    });
  }

  notifyDeploymentError(message){
    console.log(`DEPLOY | Setting error message to :`, message);
    this.setState({
      ...this.state,
      error: message || "ERROR: Could not create GitHub repository."
    }, () => console.log(`DEPLOY | State after setting error:`, this.state));
  }

  render(){
    return (
      <div>

        <div className="dialogue-header-container">

          <div>
          <h2>Deploy {this.props.projectName}</h2>
          <p>Create a GitHub repository for your project.</p>
          </div>
          <button className="button-fade"
            style={{
              marginLeft: 'auto',
            }}
            onClick={this.props.onClose}>
          <CloseIcon  />
          </button>

        </div>

        <div className="dialogue-text-edit-container">
          <p> Repository Name </p>
          <input
            type="text"
            placeholder={this.state.repo.name}
            onChange={e => this.setState({
              ...this.state,
              repo: {
                ...this.state.repo,
                name: e.target.value
              }
            })}
          />
        </div>

        <div className="dialogue-text-edit-container">
          <p> Repository Description </p>
          <input
            type="text"
            placeholder={this.state.repo.desc}
            onChange={e => this.setState({
              ...this.state,
              repo: {
                ...this.state.repo,
                desc: e.target.value
              }
            })}
          />
        </div>

        <p className="subtext">
          Before continuing, CRIMSON needs permission to create repositories
          on your GitHub account.
        </p>

        {
          !this.state.repo.url ?
          <div style={{
            marginBottom: '10px',
            padding: '10px 0px 10px 0px'
          }}>
            {
              /** Display any error messages after trying to deploy. */
              this.state.error ?
                <p className="failure"> Could not create repository: {this.state.error} </p>
              : ""
            }
            {
              !this.state.awaitingDeployment ?
              <Fade collapse when={!this.state.awaitingDeployment}>
                <GitHubDeployActions
                  sessionID={this.props.sessionID}
                  handleGithubAuth={this.handleGithubAuth}
                  handleDeploy={this.handleDeploy}
                  oAuthToken={this.props.oAuthToken}
                />
                </Fade>
                :
                <Fade collapse when={this.state.awaitingDeployment}>
                  <DeployingIndicator />
                </Fade>
              }
            </div>
          :
          <PostGitHubDeployActions
            repo={this.state.repo}
          />
        }


        <p className="subtext">Once your project is published to GitHub, you
        can deploy it on Heroku and recieve a live URL which you can share.</p>

      </div>
    );
  }
}

export default DeployDialogue;
