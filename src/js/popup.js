

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

const authenticate = (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: 'https://app.causeanalytics.com/login'
  });
  // close the popup
  window.close();
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

  self.setWorkspace = function(workspace) {
    chrome.storage.local.set({ ifWorkspace : workspace }, function() {
      //console.log('workspace set to ' + workspace.name );
    });
  };

  self.setWorkflow = function(workflow) {
    chrome.storage.local.set({ ifWorkflow : workflow });
  };


  self.getWorkspaces = function() {
    chrome.runtime.sendMessage({ cmd: 'get-workspaces', email: self.email() }, function(workspaces) {
      const mappedWorkspaces = workspaces.map((workspace) => {
        return new Workspace(workspace);
      });
      self.workspaces(mappedWorkspaces);
      self.getSelectedWorkspace();
    });
  };


  self.getWorkflows = function(workspace) {
    chrome.runtime.sendMessage({ cmd: 'get-workflows', workspace: workspace }, function(workflows) {
      const mappedWorkflows = workflows.map((workflow) => {
        return new Workflow(workflow);
      });
      self.workflows(mappedWorkflows);
      self.getSelectedWorkflow();
    });
  };


  self.getSelectedWorkspace = function() {
    chrome.storage.local.get(['ifWorkspace'], function(result) {
      if(result.ifWorkspace) {
        const koWorkspace = ko.utils.arrayFirst(self.workspaces(), (item) => {
          return item.name === result.ifWorkspace.name;
        });
        self.selectedWorkspace(koWorkspace);
      } else {
        self.selectedWorkspace(self.workspaces()[0]);
      }
      self.setWorkspace(self.selectedWorkspace());
      self.getWorkflows(self.selectedWorkspace());
    });
  };


  self.getSelectedWorkflow = function() {
    chrome.storage.local.get(['ifWorkflow'], function(result) {
      const koWorkflow = ko.utils.arrayFirst(self.workflows(), (item) => {
        return item.name === result.ifWorkflow.name;
      });
      const workflow = koWorkflow ? koWorkflow : self.workflows()[0];
      self.selectedWorkflow(workflow);
      self.setWorkflow(workflow);
    });
  };


  // bindings
  $(document).on('change', 'select#workspaces', function(){
    const selectedWorkspace = $($(this).children("option:selected").get(0)).text();
    const workspace = ko.utils.arrayFirst(self.workspaces(), (item) => {
      return item.name === selectedWorkspace;
    });
    if(workspace){
      self.setWorkspace(workspace);
      self.getWorkflows(workspace);
    }
  });

  $(document).on('change', 'select#workflows', function(){
    const selectedWorkflow = $($(this).children("option:selected").get(0)).text();
    const workflow = ko.utils.arrayFirst(self.workflows(), (item) => {
      return item.name === selectedWorkflow;
    });
    if(workflow){
      self.setWorkflow(workflow);
    }
  });

};


window.onload = function() {

  // initialize popup
  const settingsModel = new SettingsModel();
  ko.applyBindings(settingsModel);

  // check login
  checkLogin(settingsModel);

  // update authenticated state
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === 'profile-data') {
      if(request.data.email) {
        settingsModel.email(request.data.email);
        settingsModel.isAuthenticated(true);
      } else {
        settingsModel.isAuthenticated(false);
      }
    }
  });

  // event bindings
  $(document).on('click', '#authenticate', authenticate);
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

  chrome.runtime.sendMessage({ cmd: 'popup-opened' });

};
