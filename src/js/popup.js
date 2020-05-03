chrome.runtime.sendMessage({cmd: 'popup-opened'});

const bookmark = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      cmd: 'bookmark-page'
    });
    // close the popup
    window.close();
  });
};


const note = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      cmd: 'take-a-note'
    });
    // close the popup
    window.close();
  });
};


const getProfile = (settingsModel) => {
  chrome.runtime.sendMessage({
    cmd: 'get-profile'
  }, function(response) {
    settingsModel.email(response.email);
    settingsModel.getWorkspaces();
  });
};

const checkLogin = (settingsModel) => {
  chrome.runtime.sendMessage({
    cmd: 'get-cookie'
  }, function(response) {
    if(response.authenticated) {
      settingsModel.isAuthenticated(true);
      getProfile(settingsModel);
    }
  });
};

const setWorkflow = (workflow) => {
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      cmd: 'set-workflow',
      workflow: workflow
    });
  });
};

const authenticate = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage({
      cmd: 'web-app-login'
    });
    // close the popup
    window.close();
  });
};


const Workspace = function(data) {
  this.name = data.name;
  this.id = data.id;
};


const Workflow = function(data) {
  this.name = data.name;
  this.uid = data.uid;
  this.workflowid = data.id;
};


const SettingsModel = function() {
  const self = this;
  self.workspaces = ko.observableArray();
  self.workflows = ko.observableArray();
  self.isAuthenticated = ko.observable(false);
  self.selectedWorkspace = ko.observable();
  self.selectedWorkflow = ko.observable();
  self.email = ko.observable('');

  self.getWorkspaces = () => {
    chrome.runtime.sendMessage({
      cmd: 'get-workspaces',
      email: self.email()
    }, function(response) {
      if (!response[0].workspaces || response[0].workspaces.length < 1) {
        return;
      }
      const mappedWorkspaces = response[0].workspaces.map((workspace) => {
        return new Workspace(workspace);
      });
      self.workspaces(mappedWorkspaces);
      self.selectedWorkspace(mappedWorkspaces[0].name);
      self.getWorkflows();
    });
  };


  self.getWorkflows = () => {
    chrome.runtime.sendMessage({
      cmd: 'get-workflows',
      workspace: self.selectedWorkspace()
    }, function(response) {
      if (!response[0] || !response[0].workflows || response[0].workflows.length < 1) {
        return;
      }
      const mappedWorkflows = response[0].workflows.map((workflow) => {
        return new Workflow(workflow);
      });
      self.workflows(mappedWorkflows);
      $('#popup-loader').hide();
      $('#popup-content').fadeIn('fast');
    });
  };


  self.selectedWorkspace.subscribe(function(workspace) {
    self.getWorkflows();
  }, self);


  self.selectedWorkflow.subscribe(setWorkflow);

};


//$(document).ready(function() {
window.onload = function() {

  // initialize popup
  const settingsModel = new SettingsModel();
  ko.applyBindings(settingsModel);

  // check login
  checkLogin(settingsModel);

  // update authenticated state
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.cmd === 'profile-data') {
        settingsModel.email(request.data.profile.email);
        settingsModel.isAuthenticated(true);
      }
    }
  );

  // event bindings
  $(document).on('click', '#authenticate', authenticate);
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

};
