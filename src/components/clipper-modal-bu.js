window.customElements.define('ca-clipper-modal', class extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    let shadowRoot = this.attachShadow({ mode: 'open' });

    const bootstrap = chrome.runtime.getURL('css/bootstrap.min.css');
    const clipCSS = chrome.runtime.getURL('css/clipper-modal.css');

    shadowRoot.innerHTML = `<style>
        @import url(${bootstrap});
        @import url(${clipCSS});
      </style><slot name="modal"></slot>
      <div slot="modal" class="modal modal-right fade" id="clip-modal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modal-title"></h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div class="modal-body" id="clip-modal-body"></div>
          </div>
        </div>
      </div>`;

    $('#clip-modal').on('hidden.bs.modal', function(e) {
      $('#clip-modal-body').html('');
    });

  }
});
