'use strict';

const insightFactory = {};

let selectionEndTimeout = null;

const initTypeForm = function(options) {

  // set the modal header title
  $('#cause-clipper-title').text(options.title);

  // load the typeform
  const embedElement = document.querySelector(options.target);
  window.typeformEmbed.makeWidget(embedElement, 'https://causeanalytics.typeform.com/to/W5UkZw?ifuuid=' + insightFactory.currentUUID + '&url=' + window.location.href + '&cliptype=' + options.cliptype, {
    hideFooter: true,
    hideHeaders: true,
    opacity: 0,
    onSubmit: () => {
      // close the modal, submit the actual clip and confirm the submission here
      console.info('done');
    }
  });
};


const userSelectionChanged = function() {
  // wait 500 ms after the last selection change event
  if (selectionEndTimeout) {
    clearTimeout(selectionEndTimeout);
    selectionEndTimeout = null;
    return;
  }
  selectionEndTimeout = setTimeout(function() {
    $(window).trigger('selectionEnd');
  }, 500);
};


const selectionHandler = function(e) {

  const selection = document.getSelection();

  if (selection.rangeCount > 0) {
    // get the selected range
    const selectionRange = document.getSelection().getRangeAt(0);
    insightFactory.safeRanges = SelectionUtils.getSafeRanges(selectionRange);

    // const elem = selection.getRangeAt(0).startContainer.parentNode;
    const uuid = StringUtils.newUUID();
    insightFactory.uuid = uuid;

    insightFactory.safeRanges.forEach((range) => {
      SelectionUtils.highlightRange(range, uuid);
    });

    // set up the toolbar
    $('clip[data-ifuuid="' + uuid + '"]:first').toolbar({
      content: '#toolbar-options',
      position: 'top',
      style: 'factory',
      animate: 'standard',
      event: 'hover',
      adjustment: -10,
      hideOnClick: true
    }).trigger('mouseenter');

    //TODO check for pressed class before triggering mouseenter multiple times


    // set the current UUID when the toolbar is shown
    $('[data-ifuuid="' + uuid + '"]:first').on('toolbarShown', function(event) {
      insightFactory.currentUUID = uuid;
    });

    $('[data-ifuuid="' + uuid + '"]:first').on('toolbarItemClick', function(event) {
      $('#toolbar-options').hide();
    });

  }

};


const appendToolbar = function() {
  const causeicon = chrome.runtime.getURL('img/cause-logo.png');
  const toolbar = '<div id="toolbar-options" class="hidden"><a class="clip"><img src="' + causeicon + '" alt="clip to insight factory" height="100%" /></a><a href="#"><i class="fa fa-file-text"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>';
  $('body').append(toolbar);

  // toolbar button event handlers
  $(document).on('click', 'a.clip', function(e) {
    initTypeForm({
      target: '#clipper-modal-body',
      title: 'Save clip',
      cliptype: 'clip'
    });
    $('#clipper-modal-trigger').click();
  });
};


const appendClipModal = function() {

  // add the custom element and namespace our css
  const clipperModal = document.createElement("ca-clipper-modal");
  clipperModal.setAttribute('class', 'ca-clipper');
  document.body.appendChild(clipperModal);

  const clippermodal = chrome.runtime.getURL('html/clipper-modal.html');

  // load and initialize the modal
  $('ca-clipper-modal').load(clippermodal, function() {
    // init the animated modal
    $('#clipper-modal-trigger').animatedModal({
			modalTarget: 'cause-clipper-modal',
			color: 'white',
			animatedIn: 'fadeInRightBig',
			animatedOut: 'fadeOutRight',
			animatedDuration: 0.2,
			overflow: 'auto',
			opacityIn: 0.97,
			zIndexIn: 9998,
			width: '400px',
			location: 'right',
      beforeOpen: function() {
				$('.ca-clipper-overlay').fadeIn();
			},
      beforeClose: function() {
				$('.ca-clipper-overlay').fadeOut();
			},
			afterClose: () => {
        $('#clipper-modal-body').html('');
			}
		});
  });
};


/**
 * initialise extension
 */
$(document).ready(function() {

  // init the toolbar
  appendToolbar();
  appendClipModal();

  // selection event handler
  $(window).bind('selectionEnd', function() {
    selectionHandler();
  });

  // set up the initial selection changed event
  document.onselectionchange = userSelectionChanged;

  // event listener - triggers bookmarking
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "clip-page") {
      insightFactory.currentUUID = StringUtils.newUUID();
      initTypeForm({
        cliptype: 'bookmark'
      });
      $('#clip-modal').modal('show');
    }
  });

});
