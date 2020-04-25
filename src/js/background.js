const getProfile = function(sendResponse) {
  $.get('https://app.causeanalytics.com/api/user', function(data){
    sendResponse(data);
  });
};

const getWorkspaces = function(email, sendResponse) {
  $.get('https://api.causeanalytics.com/workspaces?email=' + email, function(data){
    sendResponse(data);
  });
};

const getWorkflows = function(workspace, sendResponse) {
  $.get('https://api.causeanalytics.com/workflows?workspace=' + workspace, function(data){
    sendResponse(data);
  });
};

const submitClip = function(clipdata, sendResponse) {
  fetch('https://api.causeanalytics.com/clips', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlOGVmMWM5NmYwZDE2MTY5ZTNjMTA5OCIsImlhdCI6MTU4NjQyNjQyNiwiZXhwIjoxNTg5MDE4NDI2fQ.ZZ8QUSIDalRXIapTb3mEk7BJeJ5o9jHuAJFYvac60LA'
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
    if(request.cmd == 'get-clip-dialog') {
        $.ajax({
            url: chrome.extension.getURL("html/clip-dialog.html"),
            dataType: "html",
            success: sendResponse
        });
    } else if (request.cmd == 'web-app-login') {
      chrome.tabs.create({ url: 'https://app.causeanalytics.com/login' });
      return true;
    } else if (request.cmd == 'get-cookie') {
      chrome.cookies.get({ url: 'https://app.causeanalytics.com', name: 'connect.sid' },(cookie) => {
        sendResponse({ authenticated: cookie ? true : false });
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
    } else if (request.cmd == 'submit-clip') {
      submitClip(request.data, sendResponse);
      return true;
    }
});

// const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlOGVmMWM5NmYwZDE2MTY5ZTNjMTA5OCIsImlhdCI6MTU4NjQyNjQyNiwiZXhwIjoxNTg5MDE4NDI2fQ.ZZ8QUSIDalRXIapTb3mEk7BJeJ5o9jHuAJFYvac60LA';

/*$.get('http://localhost:1337/posts', {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  })
  .then(response => {
    // Handle success.
    console.log('Data: ', response.data);
  })
  .catch(error => {
    // Handle error.
    console.log('An error occurred:', error);
  });*/
