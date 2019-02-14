import * as React from "react";
import * as ReactDOM from "react-dom";

import "whatwg-fetch";

import App from "./App";

class PAIPluginElement extends HTMLElement {
  public connectedCallback() {
    const api = this.getAttribute("pai-rest-server-uri") as string;
    const user = this.getAttribute("pai-user");
    const token = this.getAttribute("pai-rest-server-token");
    if (user === null || token === null) {
      window.location.href = "/login.html";
      return;
    }
    ReactDOM.render(React.createElement(App, { api, user, token }), this);
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this);
  }
}

window.customElements.define("pai-plugin", PAIPluginElement);
