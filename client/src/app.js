/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SharedMap } from "fluid-framework";
import { LiveShareClient } from "@microsoft/live-share";
import { app, pages, meeting } from "@microsoft/teams-js";
import { getQuestion } from "./questions";
import { AzureClient, AzureFunctionTokenProvider } from "@fluidframework/azure-client";

const config = require('./app.config');

const searchParams = new URL(window.location).searchParams;
const root = document.getElementById("content");

// Define container schema
const questionValueKey = "questionValueKey";
const lastQuestionKey = "lastQuestionKey";

const containerSchema = {
  initialObjects: { questionMap: SharedMap }
};

function onContainerFirstCreated(container) {
  container.initialObjects.questionMap.set(questionValueKey, ".....");
  container.initialObjects.questionMap.set(lastQuestionKey,[""])
}


// STARTUP LOGIC

async function start() {

  // Check for page to display
  let view = searchParams.get('view') || 'stage';

  // Check if we are running on stage.
  if (!!searchParams.get('inTeams')) {

    // Initialize teams app
    await app.initialize();

    // Get our frameContext from context of our app in Teams
    const context = await app.getContext();
    if (context.page.frameContext == 'meetingStage') {
      view = 'stage';
    }
  }

  // Render load screen
  renderLoadScreen(root);

  // Load the requested view
  switch (view) {
    case 'content':
      try {
        const { container } = await joinContainer();
        renderSideBar(container.initialObjects.questionMap, root);
      } catch (error) {
        console.log(error);
        renderError(root, error);
      }
      break;
    case 'config':
      renderSettings(root);
      break;
    case 'stage':
    default:
      try {
        const { container } = await joinContainer();
        renderStage(container.initialObjects.questionMap, root);
      } catch (error) {
        renderError(root, error);
      }
      break;
  }
}

async function joinContainer() {
  // Are we running in teams?
  let client;
  let newContainer;

if (!!searchParams.get('inTeams')) {
      client = new LiveShareClient();
      newContainer = await client.joinContainer(containerSchema, onContainerFirstCreated);
  } else {
      // Create client and configure for testing
      client = new AzureClient({
        connection: {
          type: 'remote',
          tenantId: config.fluidrelay.tenantId,
          tokenProvider: new AzureFunctionTokenProvider(config.fluidrelay.tokenProviderUrl, { id: "123", name: "Test User" }),
          endpoint: config.fluidrelay.endpoint
        }
      });

      if(location.hash) {
        const containerid = location.hash.substring(1);
        const {container } = await client.getContainer(containerid,containerSchema);
        newContainer = { container };
      }
      else {
        const { container } = await client.createContainer(containerSchema);
        const containerid = await container.attach();
        location.hash = containerid;
        container.initialObjects.questionMap.set(questionValueKey, ".....");
        container.initialObjects.questionMap.set(lastQuestionKey,[""]);
        newContainer = { container };
      }
  }

  return newContainer;
}

// LOAD SCREEN
const loadingTemplate = document.createElement("template");
loadingTemplate["innerHTML"] =
  `
  <style>
  .wrapper { text-align: center; color: white; }
  .waiter {
      height:300px; 
      margin: 0 auto; 
      font-size: large;
      display: flex;
      justify-content: center; 
      align-items: center;
  }
  </style>
  <div class='wrapper'>
    <h1>Question of the day</h1>
    <div class'waiter'>Starting ...</div>
  </div>
  `;

function renderLoadScreen(elem) {
  elem.appendChild(loadingTemplate.content.cloneNode(true));
} 


// STAGE VIEW

const stageTemplate = document.createElement("template");

stageTemplate["innerHTML"] = `
  <style>
  .wrapper { text-align: center; color: white; }
  .title { font-size: large; font-weight: bolder; }
  .text { font-size: medium; }
  .question { 
    padding:10px; 
    margin: 0 auto; 
    font-size: 30px; 
    width:220px; 
    height:300px; 
    border:4px solid #ccc;
    display: flex;
    justify-content: center; 
    align-items: center;
  }
  .pick { font-size: 20px;}
  </style>
  <div class="wrapper">
  <h1>Question of the day</h1>
  <div class="question"></div>
  <p></p>
  <button class="pick" id="prev"> << </button>
  <button class="pick" id="next"> >> </button>
  </div>
`;

function renderStage(questionMap, elem) {
    elem.replaceChildren();
    elem.appendChild(stageTemplate.content.cloneNode(true));

    const nextButton = document.getElementById("next");
    const prevButton = document.getElementById("prev");
    const question = elem.querySelector(".question");

    nextButton.onclick = () => {
      let currentQuestion = questionMap.get(questionValueKey);
      if(currentQuestion) {
        let questions = questionMap.get(lastQuestionKey);
        questions.push(currentQuestion);
        if(questions.length > 3) {
          //remove first items in array to keep array max lenght of 3
          questions.splice(0,1);
        }
        questionMap.set(lastQuestionKey,questions);
        prevButton.disabled = false;
      }
      questionMap.set(questionValueKey, getQuestion());
    }

    prevButton.onclick = () => {
      let lastQuestions = questionMap.get(lastQuestionKey);
      if(lastQuestions.length > 0) {
        let question = lastQuestions[lastQuestions.length - 1];
        questionMap.set(questionValueKey, question);
        lastQuestions.pop();
        if(lastQuestions.length == 0) {
          prevButton.disabled = true;
        }
        questionMap.set(lastQuestionKey,lastQuestions);
      }
    }

    // Get the current value of the shared data to update the view whenever it changes.
    const updateQuestion = () => {
        const questionValue = questionMap.get(questionValueKey);
        question.textContent = questionValue;
    };

    question.textContent = "Connecting ...";
    if(questionMap)
      updateQuestion();
    else
      question.textContent = "No questionMap available ...";

    // Use the changed event to trigger the rerender whenever the value changes.
    questionMap.on("valueChanged", updateQuestion);
}

// SIDEBAR VIEW

const sideBarTemplate = document.createElement("template");

sideBarTemplate["innerHTML"] = `
<style>
  .wrapper { text-align: center; color: white; }
  .title { font-size: large; font-weight: bolder; }
  .text { font-size: medium; }
  .question { 
    padding:10px; 
    margin: 0 auto; 
    font-size: 30px; 
    width:220px; 
    height:300px; 
    border:4px solid #ffff;
    display: flex;
    justify-content: center; 
    align-items: center;
  }
  .pick { font-size: 20px;}
</style>
<div class="wrapper">
  <h1>Question today</h1>
  <div class="question"></div>
  <p></p>
  <button class="pick" id="prev"> << </button>
  <button class="pick" id="next"> >> </button>
</div>
`;

function renderSideBar(questionMap, elem) {
    elem.replaceChildren();
    elem.appendChild(sideBarTemplate.content.cloneNode(true));

    const nextButton = document.getElementById("next");
    const prevButton = document.getElementById("prev");
    const question = elem.querySelector(".question");

    nextButton.onclick = () => {
      let currentQuestion = questionMap.get(questionValueKey);
      if(currentQuestion) {
        let questions = questionMap.get(lastQuestionKey);
        questions.push(currentQuestion);
        if(questions.length > 3) {
          //remove first items in array to keep array max lenght of 3
          questions.splice(0,1);
        }
        questionMap.set(lastQuestionKey,questions);
        prevButton.disabled = false;
      }
      questionMap.set(questionValueKey, getQuestion());
    }

    prevButton.onclick = () => {
      let lastQuestions = questionMap.get(lastQuestionKey);
      if(lastQuestions.length > 0) {
        let question = lastQuestions[lastQuestions.length - 1];
        questionMap.set(questionValueKey, question);
        lastQuestions.pop();
        if(lastQuestions.length == 0) {
          prevButton.disabled = true;
        }
        questionMap.set(lastQuestionKey,lastQuestions);
      }
    }

    // Get the current value of the shared data to update the view whenever it changes.
    const updateQuestion = () => {
        const questionValue = questionMap.get(questionValueKey);
        question.textContent = questionValue;
    };

    question.textContent = "Connecting ...";
    if(questionMap)
      updateQuestion();
    else
      question.textContent = "No questionMap available ...";

    // Use the changed event to trigger the rerender whenever the value changes.
    questionMap.on("valueChanged", updateQuestion);
}

function shareToStage() {
  meeting.shareAppContentToStage((error, result) => {
    if (!error) {
      console.log("Started sharing, sharedToStage result")
    } else {
      console.warn("SharingToStageError", error);
    }
  }, window.location.origin + '?inTeams=1&view=stage');
}

// SETTINGS VIEW

const settingsTemplate = document.createElement("template");

settingsTemplate["innerHTML"] = `
  <style>
    .wrapper { text-align: center; color: white }
    .title { font-size: large; font-weight: bolder; }
    .text { font-size: medium; }
  </style>
  <div class="wrapper">
    <p class="title">Welcome to Question Of The Day App!</p>
    <p class="text">Press the save button to continue.</p>
  </div>
`;

function renderSettings(elem) {
    elem.replaceChildren();
    elem.appendChild(settingsTemplate.content.cloneNode(true));

    // Save the configurable tab
    pages.config.registerOnSaveHandler(saveEvent => {
      pages.config.setConfig({
        websiteUrl: window.location.origin,
        contentUrl: window.location.origin + '?inTeams=1&view=content',
        entityId: 'QOTH',
        suggestedDisplayName: 'Question Of The Day'
      });
      saveEvent.notifySuccess();
    });

    // Enable the Save button in config dialog
    pages.config.setValidityState(true);
}

// Error view

const errorTemplate = document.createElement("template");

errorTemplate["inner"+"HTML"] = `
  <style>
    .wrapper { text-align: center; color: green }
    .error-title { font-size: large; font-weight: bolder; }
    .error-text { font-size: medium; }
  </style>
  <div class="wrapper">
    <p class="error-title">Something went wrong</p>
    <p class="error-text"></p>
    <button class="refresh"> Try again </button>
  </div>
`;

function renderError(elem, error) {
    elem.appendChild(errorTemplate.content.cloneNode(true));
    const refreshButton = elem.querySelector(".refresh");
    const errorText = elem.querySelector(".error-text");

    // Refresh the page on click
    refreshButton.onclick = () => {
      window.location.reload();
    };
    console.error(error);
    const errorTextContent = error.message.toString();
    errorText.textContent = errorTextContent;
}

start().catch((error) => console.error(error));
