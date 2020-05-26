
// Saves options to chrome.storage
function save_options() {
  const color = document.getElementById('color').value;
  chrome.storage.sync.set({
    color: color
  }, function() {
    const highlight = document.getElementById('highlight').checked;
    chrome.storage.sync.set({
      highlighter: highlight
    }, function() {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 1500);
    });
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
  // default value '#E6E6FA'
  chrome.storage.sync.get({
    color: '#E6E6FA'
  }, function(items) {
    document.getElementById('color').value = items.color;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
