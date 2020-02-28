"use strict";

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

}


const highlightRange = function(range) {

  if (range.toString() !== "" && range.toString().match(/\w+/g) !== null) {
    var newNode = document.createElement("span");
    newNode.setAttribute(
      "style",
      "background-color: yellow; display: inline;"
    );
    range.surroundContents(newNode);
  }

}


const highlightHandler = function(e) {

  const selection = document.getSelection();
  if (selection !== '') {
    const selectionRange = document.getSelection().getRangeAt(0);
    const safeRanges = getSafeRanges(selectionRange);
    safeRanges.forEach((range) => {
      highlightRange(range);
    });
  }

}

const appendToolbar = function() {
  const toolbar = '<div id="toolbar-options" class="hidden"><a href="#"><i class="fa fa-plane"></i></a><a href="#"><i class="fa fa-car"></i></a><a href="#"><i class="fa fa-bicycle"></i></a></div>';
  $('body').append(toolbar);
}

window.onload = function() {
  // init the toolbar
  appendToolbar();

  // event handlers
  document.onmouseup = highlightHandler;

  // toolbar event handlers
};
