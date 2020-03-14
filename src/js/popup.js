
const clipPage = (e) => {
  e.preventDefault();
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      'message': 'clip-page'
    });
    // close the popup
    window.close();
  });
}

$(document).ready(function() {

  // event bindings
  $(document).on('click', '#clip-page', clipPage);

});
