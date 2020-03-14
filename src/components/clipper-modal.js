window.customElements.define('ca-clipper-modal', class extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    //let shadowRoot = this.attachShadow({ mode: 'open' });

    //const animate = chrome.runtime.getURL('css/animate.min.css');

    //shadowRoot.innerHTML = `<style>
    //  @import url(${animate});
    //</style><slot name="modal"></slot>
    this.innerHTML = `<a id="clipper-modal-trigger" href="#cause-clipper-modal" style="display: none"></a>
    <div id="cause-clipper-modal" class="full-modal">
      <div class="container settings-help-container">
        <div class="full-modal-header margin-top-20">
          <h4 class="pull-left" id="cause-clipper-title"></h4>
          <div class="close-settings-help-modal close-full-modal menu-modal-navigator pull-right">
            <i class="ti-close"></i>
          </div>
          <hr style="clear: both" />
        </div>
        <div id="clipper-modal-body" class="full-modal-content">
        </div>
      </div>
    </div>`;
  }
});
