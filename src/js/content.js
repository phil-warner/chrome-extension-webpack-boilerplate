"use strict";

const highlightHandler = function(e) {
  var text = document.getSelection();
  if (text !== '') {
    alert(text);
  }
};

document.onmouseup = highlightHandler;
