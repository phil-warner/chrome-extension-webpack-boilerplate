'use strict';

const insightFactory = {};
insightFactory.selections = [];

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
  }
  selectionEndTimeout = setTimeout(function() {
    $(window).trigger('selectionEnd');
  }, 200);
};


const selectionHandler = function(e) {

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
    new TooltipEventHandler(clipRoot, tooltip, uuid);

    // create the tooltip
    let popper = Popper.createPopper(clipRoot, tooltip, {
      placement: 'top',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [20, 15],
          }
        }
      ]
    });

    // trigger the tooltip the first time
    const mouseenterEvent = new Event('mouseenter');
    document.querySelector('clip').dispatchEvent(mouseenterEvent);

    // save the selection
    insightFactory.selections.push({
      selection: selection,
      uuid: uuid,
      ranges: safeRanges,
      popper: popper,
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
      <a href="#" class="save-clip"><i class="fa fa-lg fa-share-alt"></i></a><a href="#" class="tag-clip"><i class="fa fa-lg fa-tag"></i></a><a href="#"><i class="fa fa-lg fa-trash"></i></a>
      <div id="ca-arrow" class="ca-arrow" data-popper-arrow></div>
    </div>`;
  $('body').append(toolbar);

  // toolbar button event handlers
  $(document).on('click', 'a.tag-clip', function(e) {
    e.preventDefault();
    SelectionUtils.highlightRange();
    window.getSelection().empty();
    initTypeForm({
      target: '#clipper-modal-body',
      title: 'Tag this clip',
      cliptype: 'clip'
    });

    $('#clipper-modal-trigger').click();
  });

  $(document).on('click', 'a.save-clip', function(e) {
    e.preventDefault();
    // highlight the range for this clip
    SelectionUtils.highlightRange();
    window.getSelection().empty();

    //TODO - push this to the data layer

    // mark this one as saved
    const clip = insightFactory.selections.find((range) => {
      return range.uuid = insightFactory.currentUUID;
    });
    if(clip) {
      clip.saved = true;
    }
  });

  // delete the clip
  $(document).on('click', 'a.delete-clip', function(e) {
    e.preventDefault();
    const index = insightFactory.ranges.findIndex((range) => {
      return range.uuid = insightFactory.currentUUID;
    });
    insightFactory.selections[index].popper.destroy();
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

  // init the toolbar
  appendToolbar();
  appendClipModal();

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

  // selection event handler
  $(document).on('mouseup', selectionHandler);

  $(window).click(function() {
    $('#ca-tooltip').removeAttr('data-show');
  });

});
