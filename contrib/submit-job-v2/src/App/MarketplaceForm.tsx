// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React from "react";
import {
  Callout, DefaultButton, Dropdown, DropdownMenuItemType,
  Fabric, IDropdownOption, Stack, PrimaryButton, TextField,
  mergeStyleSets,
} from "office-ui-fabric-react";
import Cookies from "js-cookie";

type MarketplaceUriType = ("GitHub" | "DevOps" | null);

interface IProtocolItem {
  name: string;
  uri: string;
}

interface IMarketplaceProps {
  defaultURI: string;
  defaultURIType: MarketplaceUriType;
  defaultURIToken: string;
  defaultOption: string | number | undefined;
  onSelectProtocol: ((text: string) => void);
  disabled: boolean;
}

interface IMarketplaceState {
  uri: string;
  uriType: MarketplaceUriType;
  uriToken: string;
  selectedOption: string | number | undefined;
  protocolOptions: IDropdownOption[];
  uriConfigCallout: boolean;
}

const styles = mergeStyleSets({
  dropdown: {
    width: 200,
  },
  textfiled: {
    width: 480,
  },
});

const defaultProtocolOptions: IDropdownOption[] = [
  { key: "None", text: "None" },
  { key: "jobsDivider", text: "-", itemType: DropdownMenuItemType.Divider },
  { key: "jobsHeader", text: "Protocol Jobs", itemType: DropdownMenuItemType.Header },
];

export default class MarketplaceForm extends React.Component<IMarketplaceProps, IMarketplaceState> {
  public static defaultProps: Partial<IMarketplaceProps> = {
    defaultURI: "https://api.github.com/repos/Microsoft/pai/contents/marketplace-v2",
    defaultURIType: "GitHub",
    defaultURIToken: "",
    defaultOption: undefined,
    disabled: false,
  };

  public state = {
    uri: this.props.defaultURI,
    uriType: this.props.defaultURIType,
    uriToken: this.props.defaultURIToken,
    selectedOption: this.props.defaultOption,
    protocolOptions: defaultProtocolOptions,
    uriConfigCallout: false,
  };

  private uriConfigCalloutBtn = React.createRef<HTMLDivElement>();

  public componentDidMount() {
    this.setProtocolOptions();
  }

  public render() {
    return (
      <Fabric>
        <Stack gap={5} wrap={true} horizontal={true} verticalAlign="center">
          <Stack>
            <Dropdown
              className={styles.dropdown}
              placeholder="Select a protocol config file"
              selectedKey={this.state.selectedOption}
              options={this.state.protocolOptions}
              onChange={this.selectProtocol}
              disabled={this.props.disabled}
            />
          </Stack>
          <Stack maxWidth="5px">
            <div ref={this.uriConfigCalloutBtn}>
              <DefaultButton
                onClick={this.toggleConfigCallout}
                iconProps={{iconName: "ConfigurationSolid"}}
                text="URI"
                disabled={this.props.disabled}
              />
            </div>
            <Callout
              role="alertdialog"
              target={this.uriConfigCalloutBtn.current}
              onDismiss={this.toggleConfigCallout}
              setInitialFocus={true}
              hidden={!this.state.uriConfigCallout}
            >
              <Stack padding={20}>
                <TextField
                  className={styles.textfiled}
                  label="Marketplace URI"
                  prefix={this.state.uriType || undefined}
                  value={this.state.uri}
                  onChange={this.setMarketplaceURI}
                />
                <TextField
                  className={styles.textfiled}
                  label="Personal Access Token"
                  value={this.state.uriToken}
                  onChange={this.setMarketplaceURIToken}
                />
                <Stack gap={20} padding="15px auto 0" horizontalAlign="center" horizontal={true}>
                  <PrimaryButton text="Apply" onClick={this.applyConfigCallout} />
                  <DefaultButton text="Discard" onClick={this.discardConfigCallout} />
                </Stack>
              </Stack>
            </Callout>
          </Stack>
        </Stack>
      </Fabric>
    );
  }

  private toggleConfigCallout = () => {
    this.setState({uriConfigCallout: !this.state.uriConfigCallout});
  }

  private applyConfigCallout = () => {
    this.setProtocolOptions();
    this.setState({uriConfigCallout: false});
  }

  private discardConfigCallout = () => {
    const marketplaceCookie = Cookies.getJSON("marketplace");
    if (marketplaceCookie) {
      this.setState({
        uri: marketplaceCookie.uri,
        uriType: marketplaceCookie.type,
        uriToken: marketplaceCookie.token,
        uriConfigCallout: false,
      });
    } else {
      this.setState({
        uri: this.props.defaultURI,
        uriType: this.props.defaultURIType,
        uriToken: this.props.defaultURIToken,
        uriConfigCallout: false,
      });
    }
  }

  private formatMarketplaceURI = async (uri: string) => {
    // regex for https://github.com/{owner}/{repo}/tree/{branch}/{path}
    const githubRegExp = /^(https:\/\/)?github\.com\/([^/\s]+)\/([^/\s]+)\/tree\/(.+)$/;
    // regex for https://{org}.visualstudio.com/{project}/_git/{repoId}?path={path}&version=GB{branch}
    const devopsRegExp = /^(https:\/\/)?([^/\s]+)\.visualstudio\.com\/([^/\s]*)\/?_git\/([^\?\s]+)\?(.+)$/;
    let match;
    match = githubRegExp.exec(uri);
    if (match !== null) {
      const owner = match[2];
      const repo = match[3];
      const paths = match[4].split("/");
      let path;
      let branch;
      let refsData;
      try {
        const refs = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${paths[0]}`);
        refsData = await refs.json();
      } catch (err) {
        alert(err.message);
      }
      if (Array.isArray(refsData)) {
        for (const i of refsData) {
          const ref = i.ref.replace(/^refs\/heads\//, "");
          if (match[4].startsWith(ref)) {
            branch = ref.slice(0);
            path = match[4].slice(branch.length + 1);
            break;
          }
        }
      } else {
        branch = paths[0];
        path = paths.slice(1).join("/");
      }
      return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    }
    match = devopsRegExp.exec(uri);
    if (match !== null) {
      const org = match[2];
      const project = match[3] ? match[3] : match[4];
      const repo = match[4];
      const path = new URLSearchParams(match[5]).get("path");
      return `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${repo}/items?path=${path}&api-version=5.0`;
    }
    return uri;
  }

  private setMarketplaceURI = (event: React.FormEvent<HTMLElement>, uri?: string) => {
    if (uri !== undefined) {
      if (uri.includes("github.com")) {
        // https://github.com/{owner}/{repo}/tree/{branch}/{path}
        // https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
        this.setState({uri, uriType: "GitHub"});
      } else if (uri.includes("visualstudio.com") || uri.includes("dev.azure.com")) {
        // https://{org}.visualstudio.com/{project}/_git/{repoId}?path={path}&version=GB{branch}
        // https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repoId}/items?path={path}&api-version=5.0
        this.setState({uri, uriType: "DevOps"});
      } else {
        this.setState({uri, uriType: null});
      }
    }
  }

  private setMarketplaceURIToken = (event: React.FormEvent<HTMLElement>, uriToken?: string) => {
    if (uriToken !== undefined) {
      this.setState({uriToken});
    }
  }

  private setProtocolOptions = async () => {
    const api = await this.formatMarketplaceURI(this.state.uri);
    const protocolList = await this.getProtocolList(api, this.state.uriType);
    if (protocolList) {
      const protocolOptions: IDropdownOption[] = [... defaultProtocolOptions];
      for (const protocolItem of protocolList) {
        protocolOptions.push({
          key: protocolItem.name,
          text: protocolItem.name,
          data: protocolItem.uri,
        });
      }
      this.setState({ protocolOptions });
      Cookies.set("marketplace", {
        uri: this.state.uri,
        type: this.state.uriType,
        token: this.state.uriToken,
      });
    }
  }

  private selectProtocol = async (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option !== undefined) {
      if (option.data !== undefined) {
        const requestHeaders: HeadersInit = new Headers();
        if (this.state.uriToken) {
          requestHeaders.set(
            "Authorization",
            `Basic ${new Buffer(this.state.uriToken).toString("base64")}`,
          );
        }
        try {
          const res = await fetch(option.data, {headers: requestHeaders});
          const data = await res.text();
          this.props.onSelectProtocol(data);
          this.setState({selectedOption: option.key});
        } catch (err) {
          alert(`Cannot get ${option.data}`);
        }
      }
    }
  }

  private getProtocolList = async (uri: string, uriType: MarketplaceUriType) => {
    const requestHeaders: HeadersInit = new Headers();
    if (this.state.uriToken) {
      requestHeaders.set(
        "Authorization",
        `Basic ${new Buffer(this.state.uriToken).toString("base64")}`,
      );
    }
    if (uriType === "GitHub") {
      try {
        const res = await fetch(uri, {headers: requestHeaders});
        const data = await res.json();
        if (Array.isArray(data)) {
          const protocolList: IProtocolItem[] = [];
          for (const item of data) {
            if (item.type === "file") {
              protocolList.push({
                name: item.name,
                uri: item.download_url,
              });
            }
          }
          return protocolList;
        } else {
          alert(`Cannot get data\nPlease provide a valid marketplace uri`);
        }
      } catch (err) {
        alert(`Cannot get ${uri}\nWrong uri or access token`);
      }
    } else if (uriType === "DevOps") {
      let res;
      try {
        res = await fetch(uri, {headers: requestHeaders});
        let data = await res.json();
        if (data.isFolder && "tree" in data._links) {
          res = await fetch(data._links.tree.href, {headers: requestHeaders});
          data = await res.json();
        }
        if ("treeEntries" in data && Array.isArray(data.treeEntries)) {
          const protocolList: IProtocolItem[] = [];
          for (const item of data.treeEntries) {
            if (item.gitObjectType === "blob") {
              protocolList.push({
                name: item.relativePath,
                uri: item.url,
              });
            }
          }
          return protocolList;
        } else {
          alert(`Cannot get data\nPlease provide a valid marketplace uri`);
        }
      } catch (err) {
        if (res) {
          if (res.status === 203) {
            alert("Please provide a valid personal access token from Azure DevOps");
          } else {
            alert("Please provide a valid marketplace uri");
          }
        } else {
          alert(`Cannot get ${uri}\nWrong uri or access token`);
        }
      }
    } else {
      alert(`Cannot recognize uri ${uri}`);
    }
    return null;
  }
}
