
const bookmark = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      'message': 'bookmark-page'
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
      'message': 'take-a-note'
    });
    // close the popup
    window.close();
  });
};

const authenticate = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.runtime.sendMessage({ cmd: 'web-app-login' });
    // close the popup
    window.close();
  });
};

const Workspace = (data) => {
  this.name = data.name;
  this.id = data.id;
};


const Workflow = (data) => {
  this.name = data.name;
  this.id = data.id;
};


const SettingsModel = function() {
  const self = this;
  self.workspaces = ko.observableArray();
  self.workflows = ko.observableArray();
  self.isAuthenticated = ko.observable(false);
  self.selectedWorkspace = ko.observable();
  self.selectedWorkflow = ko.observable();

  self.getWorkspaces = () => {
    chrome.runtime.sendMessage({ cmd: 'get-workspaces', email: insightFactory.profile.email }, function(response) {
      if(!response.workspaces) { return; }
      const mappedWorkspaces = response.workspaces.map((workspace) => {
        return new Workspace(workspace);
      });
      self.workspaces(mappedWorkspaces);
      self.getWorkflows(mappedWorkspaces[0].name);
    });
  };

  self.getWorkflows = () => {
    chrome.runtime.sendMessage({ cmd: 'get-workfows', 'workspace': self.selectedWorkspace().name }, function(response) {
      const mappedWorkflows = response.workflows.map((workflow) => {
        return new Workflow(workflow);
      });
      self.workflows(mappedWorkflows);
      $('#popup-loader').hide();
      $('#popup-content').fadeIn('fast');
    });
  };

  self.setWorkflow = (workflow) => {
    chrome.runtime.sendMessage({ cmd: 'set-workfow', 'workflow': workflow });
  };

  self.checkLogin = () => {
    chrome.runtime.sendMessage({ cmd: 'get-cookie' }, function(response) {
      if(response.authenticated){
        self.isAuthenticated(true);
        self.getWorkspaces();
      }
    });
  };

  // self.checkLogin();
  if(insightFactory.isAuthenticated) {
    self.isAuthenticated(true);
    self.getWorkspaces();
  }

};


//$(document).ready(function() {
window.onload = function() {

  // check login
  AuthUtils.getCookie();

  // initialize popup
	const settingsModel = new SettingsModel();
	ko.applyBindings(settingsModel);

  // event bindings
  $(document).on('click', '#authenticate', authenticate);
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

};
