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
  Fabric, IDropdownOption, Stack, TextField,
  mergeStyleSets,
} from "office-ui-fabric-react";

type MarketplaceUriType = ("GitHub" | "DevOps" | null);

interface IProtocolItem {
  name: string;
  uri: string;
}

interface IMarketplaceProps {
  defaultURI: string;
  defaultURIType: MarketplaceUriType;
  defaultURIToken: string;
  onSelectProtocol: ((text: string) => void);
  disabled: boolean;
}

interface IMarketplaceState {
  uri: string;
  uriType: MarketplaceUriType;
  uriToken: string;
  protocolOptions: IDropdownOption[];
  uriConfigCallout: boolean;
}

const styles = mergeStyleSets({
  dropdown: {
    width: 240,
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
    disabled: false,
  };

  public state = {
    uri: this.props.defaultURI,
    uriType: this.props.defaultURIType,
    uriToken: this.props.defaultURIToken,
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
        <Stack gap={5} horizontal={true} verticalAlign="center">
          <Stack>
            <Dropdown
              className={styles.dropdown}
              placeholder="Select a protocol config file"
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
              onDismiss={this.closeConfigCallout}
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
              </Stack>
            </Callout>
          </Stack>
        </Stack>
      </Fabric>
    );
  }

  private toggleConfigCallout = () => {
    if (this.state.uriConfigCallout) {
      this.closeConfigCallout();
    } else {
      this.setState({uriConfigCallout: true});
    }
  }

  private closeConfigCallout = () => {
    this.setProtocolOptions();
    this.setState({uriConfigCallout: false});
  }

  private setMarketplaceURI = (event: React.FormEvent<HTMLElement>, uri?: string) => {
    if (uri !== undefined) {
      if (uri.includes("api.github.com")) {
        // https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
        this.setState({uri, uriType: "GitHub"});
      } else if (uri.includes("dev.azure.com")) {
        // https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/items?path={path}&api-version=5.0
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
    const protocolList = await this.getProtocolList(this.state.uri, this.state.uriType);
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
          alert(`Cannot get ${uri}`);
        }
      } catch (err) {
        alert(err.message);
      }
    } else if (uriType === "DevOps") {
      try {
        let res = await fetch(uri, {headers: requestHeaders});
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
          alert(`Cannot get ${uri}`);
        }
      } catch (err) {
        alert(err.message);
      }
    } else {
      alert(`Cannot recognize uri ${uri}`);
    }
    return null;
  }
}
