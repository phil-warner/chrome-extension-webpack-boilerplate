/**
 * static utils
 *
 * @class StringUtils
 */
class StringUtils {
  /**
   * Create a UUID
   * If string is to be used as an element ID it must begin with [::alpha::] (not number)
   *
   * @static
   * @param {Object} [options={beginWithLetter=false}] - options
   * @returns {string} new UUID
   * @memberof StringUtils
   */
  static newUUID({
    beginWithLetter = true
  } = {}) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c, index) => {
      let r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);

      // make sure first letter is a-f
      if (beginWithLetter && index === 0) {
        v = (v % 6) + 0xa; // Math.max(v, 0xa);
      }

      return v.toString(16);
    });
  }
}


class AnnotationUtils {

  static bindEscapeKey(selector) {
    $(document).keyup(function(e) {
      if (e.keyCode === 27) {
        $(selector).click();
      }
    });
  }

  static unbindEscapeKey() {
    $(document).unbind('keyup');
  }

}


class Tooltip {

  constructor(elem, tooltip, uuid, selection) {

    this.elem = elem;
    this.selection = selection;
    this.tooltip = tooltip;
    this.uuid = uuid;
    this.clips = document.querySelectorAll('clip[data-ifuuid="' + uuid + '"]');

    this.clips.forEach((clip) => {
      clip.addEventListener('mouseenter', insightFactory.renderPopper);
      clip.addEventListener('mouseleave', insightFactory.removePopper);
    });

  }

}


class SelectionUtils {

  static restoreSelection(range) {
    if (range) {
      if (window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && range.select) {
        range.select();
      }
    }
  }

  static getSafeRanges(dangerous) {
    const ancestor = dangerous.commonAncestorContainer;

    // Starts -- Work inward from the start, selecting the largest safe range
    const s = new Array(0);
    const rs = new Array(0);

    if (dangerous.startContainer != ancestor) {

      for (var i = dangerous.startContainer; i != ancestor; i = i.parentNode) {
        s.push(i);
      }

      if (s.length > 0) {
        for (var x = 0; x < s.length; x++) {
          var xs = document.createRange();
          if (x) {
            xs.setStartAfter(s[x - 1]);
            xs.setEndAfter(s[x].lastChild);
          } else {
            xs.setStart(s[x], dangerous.startOffset);
            xs.setEndAfter(
              (s[x].nodeType == Node.TEXT_NODE) ?
              s[x] : s[x].lastChild
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
      for (var y = dangerous.endContainer; y != ancestor; y = y.parentNode)
        e.push(y);
    }

    if (e.length > 0) {
      for (var z = 0; z < e.length; z++) {
        var xe = document.createRange();
        if (z) {
          xe.setStartBefore(e[z].firstChild);
          xe.setEndBefore(e[z - 1]);
        } else {
          xe.setStartBefore(
            (e[z].nodeType == Node.TEXT_NODE) ?
            e[z] : e[z].firstChild
          );
          xe.setEnd(e[z], dangerous.endOffset);
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

  static clipRange(range, uuid) {

    if (range.toString() !== "" && range.toString().match(/\w+/g) !== null) {
      var newNode = document.createElement("clip");
      newNode.setAttribute(
        "data-ifuuid",
        uuid
      );
      /*newNode.setAttribute(
        "style",
        "background-color: whitesmoke"
      );*/
      range.surroundContents(newNode);
    }
  }

  static highlightRange(color) {
    $('clip[data-ifuuid="' + insightFactory.currentUUID + '"]').css('background-color', color);
  }

  static unHighlightRange() {
    $('clip[data-ifuuid="' + insightFactory.currentUUID + '"]').prop('style', '');
  }

  static removeEventListeners() {

    const unsaved = insightFactory.selections.filter((selection) => {
      return !selection.saved;
    });

    if(unsaved.length < 1) { return; }

    unsaved.forEach((item) => {
      const elems = document.querySelectorAll('clip[data-ifuuid="' + item.uuid + '"]');
      if(elems.length > 0) {
        elems.forEach((elem) => {
          elem.removeEventListener('mouseenter', insightFactory.renderPopper);
          elem.removeEventListener('mouseleave', insightFactory.removePopper);
        });
      }
    });

  }

}


class AuthUtils {

  static getCookie() {
    chrome.runtime.sendMessage({ cmd: 'get-cookie' }, function(response) {
      insightFactory.isAuthenticated = response.authenticated;
      if(response.authenticated && !insightFactory.profile) {
        AuthUtils.getProfile();
      }
    });
  }

  static getProfile() {
    chrome.runtime.sendMessage({ cmd: 'get-profile' }, function(response) {
      insightFactory.profile = response;
    });
  }

}

class ApiUtils {

  static getWorkspaces() {
    chrome.runtime.sendMessage({ cmd: 'get-workspaces', email: insightFactory.profile.email }, function(response) {
      insightFactory.profile = response;
    });
  }

  static getWorkflows(workspace) {
    chrome.runtime.sendMessage({ cmd: 'get-workflows', workspace: workspace }, function(response) {
      insightFactory.profile = response;
    });
  }

}
