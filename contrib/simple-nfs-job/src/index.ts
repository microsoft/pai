import React from "react";
import ReactDOM from "react-dom";

import { parse } from "querystring";
import "whatwg-fetch";

import App from "./App";

declare interface IWindow {
  PAI_PLUGINS: Array<{ id?: string, uri?: string, title?: string }>;
}

class PAIPluginElement extends HTMLElement {
  public connectedCallback() {
    const api = this.getAttribute("pai-rest-server-uri") as string;
    const user = this.getAttribute("pai-user");
    const token = this.getAttribute("pai-rest-server-token");
    if (user === null || token === null) {
      window.location.href = "/login.html";
      return;
    }

    const query = parse(window.location.search.replace(/^\?/, ""));
    const pluginIndex = Number(query.index) || 0;
    const plugins = (window as unknown as IWindow).PAI_PLUGINS;
    const { id } = plugins[pluginIndex];

    const originalJobName = query.op === "resubmit" ? String(query.jobname || "") : undefined;
    const originalJobUser = query.op === "resubmit" ? String(query.user || "") : undefined;

    ReactDOM.render(React.createElement(App, {
      api,
      originalJobName,
      originalJobUser,
      pluginId: id,
      token,
      user,
    }), this);
  }

  public disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this);
  }
}

window.customElements.define("pai-plugin", PAIPluginElement);
