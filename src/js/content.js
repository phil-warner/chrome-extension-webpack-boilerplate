'use strict';

const insightFactory = {};
insightFactory.formid = 'W5UkZw';
insightFactory.selections = [];
insightFactory.isAuthenticated = false;

const initTypeForm = function(options) {

  // set the modal header title
  $('#cause-clipper-title').text(options.title);

  // load the typeform
  const embedElement = document.querySelector(options.target);
  window.typeformEmbed.makeWidget(embedElement, 'https://causeanalytics.typeform.com/to/' + insightFactory.formid + '?ifuuid=' + insightFactory.currentUUID + '&url=' + window.location.href + '&cliptype=' + options.cliptype + '&note=' + options.note, {
    hideFooter: true,
    hideHeaders: true,
    opacity: 0,
    onSubmit: () => {
      // submit the clip
      const clipData = {
        content: insightFactory.currentSelection,
        author: insightFactory.profile.email,
        uid: insightFactory.currentUUID,
        range: insightFactory.selections[insightFactory.currentUUID].range,
        type: options.cliptype,
        url: window.location.href
      };
      chrome.runtime.sendMessage({ cmd: 'submit-clip', data: clipData }, function(response) {
        return;
      });

      // close the modal
      $('.close-cause-clipper-modal').click();
    }
  });
};


const selectionHandler = function(e) {

  const tooltip = document.querySelector('#ca-tooltip');
  const inputTypes = ['INPUT', 'SELECT'];

  if(tooltip.hasAttribute('data-show') || inputTypes.includes(e.target.tagName) || e.target.isContentEditable) {
    return;
  }

  const selection = document.getSelection();

  if (!selection.isCollapsed) {
    // get the selected range
    const selectionRange = document.getSelection().getRangeAt(0);
    const safeRanges = SelectionUtils.getSafeRanges(selectionRange);

    const uuid = StringUtils.newUUID();
    insightFactory.uuid = uuid;

    safeRanges.forEach((range) => {
      SelectionUtils.clipRange(range, uuid);
    });

    // set up the toolbar
    const clipRoot = document.querySelector('clip[data-ifuuid="' + uuid + '"]');
    const tooltip = document.querySelector('#ca-tooltip');

    // add event listeners to all the matching clip elements
    new TooltipEventHandler(clipRoot, tooltip, uuid, selection);

    // trigger the tooltip the first time
    insightFactory.currentUUID = uuid;
    insightFactory.currentSelection = selection.toString();
    const mouseenterEvent = new Event('mouseenter');
    document.querySelector('clip').dispatchEvent(mouseenterEvent);

    // save the selection
    insightFactory.selections.push({
      selection: selection,
      uuid: uuid,
      ranges: safeRanges,
      saved: false
    });

    setTimeout(() => {
      document.querySelector('#ca-tooltip').setAttribute('data-show','');
    }, 250);

  }

};


const appendToolbar = function() {

  // add the toolbar to the DOM
  const toolbar = `<div id="ca-tooltip" class="ca-tooltip" role="tooltip">
      <a href="#" class="save-clip"><i class="fas fa-highlighter"></i></a><a href="#" class="tag-clip"><i class="fa fa-tag"></i></a><a href="#" class="delete-clip disabled"><i class="fa fa-trash"></i></a>
      <div id="ca-arrow" class="ca-arrow" data-popper-arrow></div>
    </div>`;
  $('body').append(toolbar);

  // toolbar button event handlers
  $(document).on('click', 'a.save-clip', function(e) {
    e.preventDefault();

    // check that we're authenticated
    if(!insightFactory.isAuthenticated) {
      // hide the tooltip - it will check authentication again for us when it's opened again
      $('#ca-tooltip').removeAttr('data-show');
      // trigger the login page in a new tab
      chrome.runtime.sendMessage({ cmd: 'web-app-login'}, function(response) {
        return;
      });
      return;
    }

    // highlight the range for this clip
    SelectionUtils.highlightRange();
    const selection = window.getSelection();

    // mark this one as saved
    const clip = insightFactory.selections.find((s) => {
      return s.uuid === insightFactory.currentUUID;
    });
    if(clip) {
      clip.saved = true;
      selection.empty();
      $('#ca-tooltip').removeAttr('data-show');
    }
  });

  $(document).on('click', 'a.tag-clip', function(e) {
    e.preventDefault();

    if(!insightFactory.isAuthenticated) {
      // hide the tooltip - it will check authentication again for us when it's opened again
      $('#ca-tooltip').removeAttr('data-show');
      // trigger the login page in a new tab
      chrome.runtime.sendMessage({ cmd: 'web-app-login'}, function(response) {
        return;
      });
      return;
    }

    SelectionUtils.highlightRange();
    window.getSelection().empty();
    initTypeForm({
      target: '#clipper-modal-body',
      title: 'Tag this clip',
      cliptype: 'clip',
      note: 'false'
    });

    $('#clipper-modal-trigger').click();
  });

  $(document).on('click', 'a.delete-clip', function(e) {
    e.preventDefault();
    SelectionUtils.unHighlightRange();
    const index = insightFactory.selections.findIndex((selection) => {
      return selection.uuid = insightFactory.currentUUID;
    });
    insightFactory.selections.splice(index, 1);

    //TODO - delete clip in the data store
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


// init extension
$(document).ready(function() {

  // update checkauthentication status
  AuthUtils.getCookie();

  // init the toolbar
  appendToolbar();
  appendClipModal();

  // external event listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "bookmark-page") {
      insightFactory.currentUUID = StringUtils.newUUID();
      initTypeForm({
        target: '#clipper-modal-body',
        title: 'Add a bookmark',
        cliptype: 'bookmark',
        note: 'false'
      });
      $('#clipper-modal-trigger').click();
    } else if (request.message === "take-a-note") {
      insightFactory.currentUUID = StringUtils.newUUID();
      initTypeForm({
        target: '#clipper-modal-body',
        title: 'Take a note',
        cliptype: 'note',
        note: 'true'
      });
      $('#clipper-modal-trigger').click();

    }
  });

  // selection event handler
  $(document).on('mouseup', selectionHandler);

  // click handler to remove tooltip when user clicks away
  $(window).click(function() {
    $('#ca-tooltip').removeAttr('data-show');
  });

  // submit the note
  $(document).on('click', '#submit-note', function() {
    $('#clipper-modal-body').hide().html('<h3>Note saved!</h3>').fadeIn('fast');
  });

});
