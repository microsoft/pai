import * as React from "react";
import * as ReactDOM from "react-dom";

import * as cookie from "js-cookie";
import "whatwg-fetch";

import App from "./App";

class PAIPluginElement extends HTMLElement {
  public connectedCallback() {
    const api = this.getAttribute("pai-rest-server-uri") as string;
    ReactDOM.render(React.createElement(App, { api }), this);
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this);
  }
}

if (cookie.get("user") === undefined) {
  window.location.href = "/login.html";
} else {
  window.customElements.define("pai-plugin", PAIPluginElement);
}
