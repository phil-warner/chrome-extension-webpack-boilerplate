const STRAPI_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlOGVmMWM5NmYwZDE2MTY5ZTNjMTA5OCIsImlhdCI6MTU4OTA0Mjg3NiwiZXhwIjoxNTkxNjM0ODc2fQ.deClDQQmqYcLW4X6oV1I0xZEnbokmCRkzeun2fK3N_o';

const getProfile = function(sendResponse) {
  $.get('https://app.causeanalytics.com/api/user', function(data) {
    chrome.runtime.sendMessage({
      cmd: 'profile-data',
      data: data
    });
    sendResponse(data);
  });
};


const getWorkspaces = function(email, sendResponse) {
  fetch('https://api.causeanalytics.com/members?email=' + email, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Authorization': STRAPI_TOKEN
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    chrome.storage.local.set({ ifWorkspaces : result[0].workspaces }, function() {
      sendResponse(result[0].workspaces);
    });
  });
};


const getWorkflows = function(workspace, sendResponse) {
  fetch('https://api.causeanalytics.com/workspaces?name=' + workspace.name, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Authorization': STRAPI_TOKEN
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    chrome.storage.local.set({ ifWorkflows : result.workflows }, function() {
      sendResponse(result[0].workflows);
    });
  });
};

const submitClip = function(clipdata, sendResponse) {
  fetch('https://api.causeanalytics.com/clips', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Authorization': STRAPI_TOKEN
    },
    body: JSON.stringify(clipdata)
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(result) {
    sendResponse(result);
  });
};


// extension background event handler
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.cmd == 'get-clip-dialog') {
    $.ajax({
      url: chrome.extension.getURL("html/clip-dialog.html"),
      dataType: "html",
      success: sendResponse
    });
  } else if (request.cmd == 'web-app-login') {
    console.log('login');
    chrome.tabs.create({
      url: 'https://app.causeanalytics.com/login'
    });
    return true;
  } else if (request.cmd == 'get-cookie') {
    chrome.cookies.get({
      url: 'https://app.causeanalytics.com',
      name: 'connect.sid'
    }, function(cookie) {
      sendResponse({
        authenticated: cookie ? true : false
      });
      return true; // required to make call synchronous
    });
    return true; // required to make call synchronous
  } else if (request.cmd == 'get-profile') {
    getProfile(sendResponse);
    return true;
  } else if (request.cmd == 'get-workspaces') {
    getWorkspaces(request.email, sendResponse);
    return true;
  } else if (request.cmd == 'get-workflows') {
    getWorkflows(request.workspace, sendResponse);
    return true;
  } else if (request.cmd == 'get-default-workflow') {
    getDefaultWorkflow(sendResponse);
    return true;
  } else if (request.cmd == 'submit-clip') {
    submitClip(request.data, sendResponse);
    return true;
  }
});
