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

type MarketplaceUriType = (null | "GitHub");

interface IProtocolItem {
  name: string;
  uri: string;
}

interface IMarketplaceProps {
  defaultURI: string;
  defaultURIType: MarketplaceUriType;
  onSelectProtocol: ((text: string) => void);
  disabled: boolean;
}

interface IMarketplaceState {
  uri: string;
  uriType: MarketplaceUriType;
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
    disabled: false,
  };

  public state = {
    uri: this.props.defaultURI,
    uriType: this.props.defaultURIType,
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
                  onBlur={this.setProtocolOptions}
                />
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

  private closeConfigCallout = () => {
    this.setState({uriConfigCallout: false});
  }

  private setMarketplaceURI = (event: React.FormEvent<HTMLElement>, uri?: string) => {
    if (uri !== undefined) {
      this.setState({
        uri,
        uriType: "GitHub",
      });
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
        try {
          const res = await fetch(option.data);
          const data = await res.text();
          this.props.onSelectProtocol(data);
        } catch (err) {
          alert(`Cannot get ${option.data}`);
        }
      }
    }
  }

  private getProtocolList = async (uri: string, uriType: MarketplaceUriType) => {
    if (uriType === "GitHub") {
      try {
        const res = await fetch(uri);
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
    }
    return null;
  }
}
