import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class AppMain extends LitElement {

  static properties = {
    hello: {type: String, state: true},
  };

  constructor() {
    super();

    this.hello = 'Hello...';

    setTimeout(() => {
      this.hello = 'Hello, world!';
    }, 3000);
  }

  render() {
    return html`
      <h1>${this.hello}</h1>
    `;
  }
}

customElements.define('app-main', AppMain);
