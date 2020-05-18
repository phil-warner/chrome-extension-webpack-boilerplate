'use strict';

const insightFactory = {};
insightFactory.selections = [];
insightFactory.isAuthenticated = false;

// popper utility functions
insightFactory.renderPopper = (e) => {

  // check for authentication again
  AuthUtils.getCookie();

  const uuid = $(e.target).data('ifuuid');
  insightFactory.currentUUID = uuid;

  // check to see if we've saved this clip yet
  const clip = insightFactory.selections.find((selection) => {
    return selection.uuid === uuid;
  });

  const $highlight = $('.highlight-clip');
  const $delete = $('.delete-clip');

  if(clip && clip.saved) {
    $highlight.removeClass('fa-highlighter').addClass('fa-check-circle');
    $delete.removeClass('disabled');
  } else {
    $highlight.removeClass('fa-circle-check').addClass('fa-highlighter');
    $delete.addClass('disabled');
  }

  // create the tooltip
  const elem = document.querySelector('clip[data-ifuuid="' + uuid + '"]');
  const tooltip = document.querySelector('#ca-tooltip');
  Popper.createPopper(elem, tooltip, {
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

  document.querySelector('#ca-tooltip').setAttribute('data-show', '');
};

insightFactory.removePopper = (e) => {
  const uuid = $(this).data('ifuuid');
  // check to see if we've saved this clip yet
  const clip = insightFactory.selections.find((selection) => {
    return selection.uuid === uuid;
  });

  // remove the highlighting is this is unsaved - it's just an affordance helper
  if((!clip || !clip.saved) && !document.querySelector('#ca-tooltip').hasAttribute('data-show')) {
    SelectionUtils.unHighlightRange();
  }
}

const initTypeForm = function(options) {

  chrome.storage.local.get(['ifWorkflow'], function(workflow) {

    workflow = workflow.ifWorkflow;
    console.log(workflow);
    // set the modal header title
    $('#cause-clipper-title').text(workflow.name);

    // load the typeform
    const embedElement = document.querySelector(options.target);
    const bookmarkUrl = window.location.href.slice(0, window.location.href.indexOf('#'));
    const typeformUrl = 'https://causeanalytics.typeform.com/to/' + workflow.uid + '?ifuuid=' + insightFactory.currentUUID + '&url=' + bookmarkUrl + '&memberid=' + insightFactory.profile.memberid + '&workflowid=' + workflow.id + '&cliptype=' + options.cliptype + '&clip=' + insightFactory.currentSelection + '&note=' + options.note;

    window.typeformEmbed.makeWidget(embedElement, typeformUrl, {
      hideFooter: true,
      hideHeaders: true,
      opacity: 0,
      onSubmit: () => {

        if(options.cliptype === 'clip') {

          chrome.storage.local.get(['ifWorkspace'], function(workspace) {
            // submit the clip
            const thisClip = insightFactory.selections.find((selection) => {
              return selection.uuid === insightFactory.currentUUID;
            });
            const clipData = {
              content: insightFactory.currentSelection.replace(/["']/g, ""),
              member: insightFactory.profile.memberid,
              uid: insightFactory.currentUUID,
              ranges: thisClip ? thisClip.ranges[0]: '',
              type: options.cliptype,
              url: window.location.href,
              workspace: workspace.id
            };
            chrome.runtime.sendMessage({ cmd: 'submit-clip', data: clipData }, function(response) {
              return;
            });
          });

        }
        // close the modal
        $('.close-cause-clipper-modal').click();
      }
    });
  });
};


const selectionHandler = function(e) {

  chrome.storage.sync.get({
    highlighter: true
  }, function(items) {

    if(!items.highlighter) {
      return;
    }

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
      new Tooltip(clipRoot, tooltip, uuid, selection);

      // trigger the tooltip the first time
      insightFactory.currentUUID = uuid;
      insightFactory.currentSelection = selection.toString();
      const mouseenterEvent = new Event('mouseenter');
      // document.querySelector(clipSelector).dispatchEvent(mouseenterEvent);
      clipRoot.dispatchEvent(mouseenterEvent);

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

  });

};


const appendToolbar = function() {

  // add the toolbar to the DOM
  const toolbar = `<div id="ca-tooltip" class="ca-tooltip" role="tooltip">
      <a href="#" class="save-clip"><i class="ca-action highlight-clip fas fa-highlighter"></i></a><a href="#" class="tag-clip"><i class="ca-action fa fa-tag"></i></a><a href="#" class="delete-clip disabled"><i class="ca-action fa fa-trash"></i></a>
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
      chrome.runtime.sendMessage({ cmd: 'web-app-login' }, function(response) {
        return;
      });
      return;
    }

    // highlight the range for this clip
    SelectionUtils.highlightRange('lavenderblush');
    const selection = window.getSelection();

    const clips = document.querySelectorAll('clip[data-ifuuid="' + insightFactory.currentUUID + '"]');
    clips.forEach((clip) => {
      clip.addEventListener('mouseenter', insightFactory.renderPopper);
      clip.addEventListener('mouseleave', insightFactory.removePopper);
    });

    // mark this one as saved
    const clip = insightFactory.selections.find((s) => {
      return s.uuid === insightFactory.currentUUID;
    });
    if(clip) {
      clip.saved = true;
      chrome.storage.local.get(['ifWorkspace'], function(workspace) {
        // submit the clip
        const clipData = {
          content: insightFactory.currentSelection,
          member: insightFactory.profile.memberid,
          uid: insightFactory.currentUUID,
          ranges: selection.getRangeAt(0),
          type: 'clip',
          url: window.location.href,
          workspace: workspace.id
        };
        chrome.runtime.sendMessage({ cmd: 'submit-clip', data: clipData }, function(response) {
          $('.highlight-clip').hide().removeClass('fa-highlighter').addClass('fa-check-circle').fadeIn('slow');
          $('.delete-clip').removeClass('disabled');
          selection.empty();
        });
      });
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
    $('.highlight-clip').hide().removeClass('fa-check-circle').addClass('fa-highlighter').fadeIn('slow');
    $('.delete-clip').addClass('disabled');

    const clips = document.querySelectorAll('clip[data-ifuuid="' + insightFactory.currentUUID + '"]');
    clips.forEach((clip) => {
      clip.removeEventListener('mouseenter', insightFactory.renderPopper);
      clip.removeEventListener('mouseleave', insightFactory.removePopper);
    });
    //TODO - delete clip in the data store
  });
};


const appendClipperModal = function() {

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
      afterOpen: function() {
        AnnotationUtils.bindEscapeKey('.close-cause-clipper-modal');
      },
      beforeClose: function() {
				$('.ca-clipper-overlay').fadeOut();
			},
			afterClose: () => {
        $('#clipper-modal-body').html('');
        AnnotationUtils.unbindEscapeKey();
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
  appendClipperModal();

  // external event listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === 'bookmark-page') {
      insightFactory.currentUUID = StringUtils.newUUID();
      initTypeForm({
        target: '#clipper-modal-body',
        cliptype: 'bookmark',
        note: 'false'
      });
      $('#clipper-modal-trigger').click();
    } else if (request.cmd === 'take-a-note') {
      insightFactory.currentUUID = StringUtils.newUUID();
      initTypeForm({
        target: '#clipper-modal-body',
        cliptype: 'note',
        note: 'true'
      });
      $('#clipper-modal-trigger').click();
    }
  });

  // selection event handler
  $(document).on('mouseup', selectionHandler);

  // click handler to remove tooltip and unsaved clips when user clicks away
  $(window).mousedown(function(e) {

    // don't close the tooltip if that is what is being clicked, or if
    if($(e.target).hasClass('ca-action')) {
      return;
    }

    $('#ca-tooltip').removeAttr('data-show');
    const clip = insightFactory.selections.find((selection) => {
      return selection.uuid === insightFactory.currentUUID;
    });

    // remove the highlighting is this is unsaved - it's just an affordance helper
    if(!clip || !clip.saved) {
      SelectionUtils.unHighlightRange();
      SelectionUtils.removeEventListeners();
    }
  });

});
