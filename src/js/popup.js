
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
}

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
}

$(document).ready(function() {

  // event bindings
  $(document).on('click', '.ca-bookmark-page', bookmark);
  $(document).on('click', '.ca-note', note);

});
