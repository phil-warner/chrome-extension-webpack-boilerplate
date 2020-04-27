
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


  self.getWorkspaces = () => {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { 'message': 'get-workspaces', 'email': insightFactory.profile.email }, (response) => {
        const mappedWorkspaces = response.workspaces.map((workspace) => {
          return new Workspace(workspace);
        });
        self.workspaces(mappedWorkspaces);
        self.getWorkflows(mappedWorkspaces[0].name);
      });
    });
  };

  self.getWorkflows = (workspace) => {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { 'message': 'get-workfows', 'workspace': workspace }, (response) => {
        const mappedWorkflows = response.workflows.map((workflow) => {
          return new Workflow(workflow);
        });
        self.workflows(mappedWorkflows);
        $('#popup-loader').hide();
        $('#popup-content').fadeIn('fast');
      });
    });
  };

  self.checkLogin = () => {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, async function(tabs) {
      const response = await chrome.tabs.sendMessage(tabs[0].id, { 'message': 'check-login' });
      if(response.isAuthenticated){
        self.isAuthenticated(true);
        self.getWorkspaces();
      }
    });
  };

  self.checkLogin();

};


$(document).ready(function() {

  // initialize popup
	const settingsModel = new SettingsModel();
	ko.applyBindings(settingsModel);

  // event bindings
  $(document).on('click', '#authenticate', authenticate);
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

});
