
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
  self.isLoggedIn = ko.observable(false);


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
      });
    });
  };
};


$(document).ready(function() {

  // initialize popup
	const settingsModel = new SettingsModel();
	ko.applyBindings(settingsModel);

  // event bindings
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

});
