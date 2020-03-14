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

  static highlightRange(range, uuid) {

    if (range.toString() !== "" && range.toString().match(/\w+/g) !== null) {
      var newNode = document.createElement("clip");
      newNode.setAttribute(
        "style",
        "background-color: mistyrose; display: inline;"
      );
      newNode.setAttribute(
        "data-ifuuid",
        uuid
      );
      range.surroundContents(newNode);
    }

  };
}
