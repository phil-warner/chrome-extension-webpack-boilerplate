
// Saves options to chrome.storage
function save_options() {
  var highlight = document.getElementById('highlight').checked;
  chrome.storage.sync.set({
    highlighter: highlight
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value = true.
  chrome.storage.sync.get({
    highlighter: true
  }, function(items) {
    document.getElementById('highlight').checked = items.highlighter;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
