import "core-js/stable";
import "whatwg-fetch";

import React from "react";
import ReactDOM from "react-dom";

import "whatwg-fetch";

import App from "./App";

class PAIMarketplacePluginElement extends HTMLElement {
  connectedCallback() {
    const api = this.getAttribute("pai-rest-server-uri");
    const user = this.getAttribute("pai-user");
    const token = this.getAttribute("pai-rest-server-token");
    const grafanaUri = this.getAttribute("pai-grafana-uri");
    const logType = this.getAttribute("pai-logType");
    const launcherType = this.getAttribute("pai-launcherType");
    const jobHistory = this.getAttribute("pai-jobHistory");
    if (user === null || token === null) {
      window.location.href = "/login.html";
      return;
    }
    ReactDOM.render(React.createElement(App, { api, user, token, grafanaUri, logType, launcherType, jobHistory }), this);
  }

  disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this);
  }
}

window.customElements.define("pai-plugin", PAIMarketplacePluginElement);
