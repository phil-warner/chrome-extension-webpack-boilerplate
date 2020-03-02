"use strict";
const insightFactory = {};

let selectionEndTimeout = null;

const userSelectionChanged = function() {
    // wait 500 ms after the last selection change event
    if (selectionEndTimeout) {
        clearTimeout(selectionEndTimeout);
    }
    selectionEndTimeout = setTimeout(function () {
        $(window).trigger('selectionEnd');
    }, 500);
}

const getSafeRanges = function(dangerous) {
  const ancestor = dangerous.commonAncestorContainer;

  // Starts -- Work inward from the start, selecting the largest safe range
  const s = new Array(0);
  const rs = new Array(0);

  if (dangerous.startContainer != ancestor) {

    for (var i = dangerous.startContainer; i != ancestor; i = i.parentNode) {
      s.push(i);
    }

    if (s.length > 0) {
      for (var i = 0; i < s.length; i++) {
        var xs = document.createRange();
        if (i) {
          xs.setStartAfter(s[i - 1]);
          xs.setEndAfter(s[i].lastChild);
        } else {
          xs.setStart(s[i], dangerous.startOffset);
          xs.setEndAfter(
            (s[i].nodeType == Node.TEXT_NODE) ?
            s[i] : s[i].lastChild
          );
        }
        rs.push(xs);
      }
    }

  }

  // Ends -- basically the same code reversed
  const e = new Array(0);
  const re = new Array(0);

  if (dangerous.endContainer != ancestor) {
    for (var i = dangerous.endContainer; i != ancestor; i = i.parentNode)
      e.push(i);
  }

  if (e.length > 0) {
    for (var i = 0; i < e.length; i++) {
      var xe = document.createRange();
      if (i) {
        xe.setStartBefore(e[i].firstChild);
        xe.setEndBefore(e[i - 1]);
      } else {
        xe.setStartBefore(
          (e[i].nodeType == Node.TEXT_NODE) ?
          e[i] : e[i].firstChild
        );
        xe.setEnd(e[i], dangerous.endOffset);
      }
      re.unshift(xe);
    }
  }

  // Middle -- the uncaptured middle
  const xm = document.createRange();
  if ((s.length > 0) && (e.length > 0)) {
    xm.setStartAfter(s[s.length - 1]);
    xm.setEndBefore(e[e.length - 1]);
  } else {
    return [dangerous];
  }

  // Concat
  rs.push(xm);
  return rs.concat(re);

};


const highlightRange = function(range, uuid) {

  if (range.toString() !== "" && range.toString().match(/\w+/g) !== null) {
    var newNode = document.createElement("span");
    newNode.setAttribute(
      "style",
      "background-color: yellow; display: inline;"
    );
    newNode.setAttribute(
      "data-ifuuid",
      uuid
    );
    range.surroundContents(newNode);
  }

};

const selectionHandler = function(e) {

  const selection = document.getSelection();

  if (selection.rangeCount > 0) {
    // get the selected range
    const selectionRange = document.getSelection().getRangeAt(0);
    insightFactory.safeRanges = getSafeRanges(selectionRange);

    // const elem = selection.getRangeAt(0).startContainer.parentNode;
    const uuid = StringUtils.newUUID();
    insightFactory.uuid = uuid;

    insightFactory.safeRanges.forEach((range) => {
      highlightRange(range, uuid);
    });

    // set up the toolbar
    $('[data-ifuuid="' + uuid + '"]:first').toolbar({
    	content: '#toolbar-options',
      position: 'top',
      style: 'factory',
      animate: 'standard',
      event: 'hover',
      adjustment: 1,
      hideOnClick: true
    }).trigger("mouseover");

    // set the current UUID when the toolbar is shown
    $('[data-ifuuid="' + uuid + '"]:first').on('toolbarShown', function( event ) {
      insightFactory.currentUUID = uuid;
    });
  }

};

const appendToolbar = function() {
  const causeicon = chrome.runtime.getURL('img/cause-logo.png');
  const toolbar = '<div id="toolbar-options" class="hidden"><a class="clip"><img src="' + causeicon + '" alt="clip to insight factory" height="100%" /></a><a href="#"><i class="fa fa-file-text"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>';
  $('body').append(toolbar);
};

const appendModal = function() {

  // load and initialize the modal
  $('body').append('<div id="clip-modal-container"></div>');
  const clipmodal = chrome.runtime.getURL('html/clip-modal.html');

  $("#clip-modal-container").load(clipmodal, function() {
    // load the typeform
    const embedElement = document.querySelector('#clip-modal-body');
    window.typeformEmbed.makeWidget(embedElement, "https://davidpids.typeform.com/to/W5UkZw", {
      hideFooter: true,
      hideHeaders: true,
      opacity: 0
    });

    // modal events
    $('#clip-modal').on('show.bs.modal', function(e){
      console.log('shown');
    });
  });

};


/**
  * initialise extension
*/
window.onload = function() {

  // init the toolbar
  appendToolbar();
  appendModal();

  // selection event handler
  $(window).bind('selectionEnd', function () {
    selectionHandler();
  });

  // set up the selection changed event
  document.onselectionchange = userSelectionChanged;

  // toolbar event handlers
  $(document).on('click', 'a.clip', (e) => {
    $('#clip-modal').modal('show');
  });
};
