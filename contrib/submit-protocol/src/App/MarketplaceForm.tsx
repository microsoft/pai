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
  Dropdown, DropdownMenuItemType, Fabric, IDropdownOption, TextField,
} from "office-ui-fabric-react";

enum MarketplaceUriType {
  None = "None",
  GitHub = "GitHub",
}

interface IMarketplaceProps {
  uri?: string;
  uriType?: MarketplaceUriType | string;
  onSelectProtocol: ((text: string) => void);
  disabled?: boolean;
}

interface IMarketplaceState {
  uri: string;
  uriType: MarketplaceUriType;
  selectedProtocol?: IDropdownOption;
  protocolOptions: IDropdownOption[];
}

export default class MarketplaceForm extends React.Component<IMarketplaceProps, IMarketplaceState> {
  public state = {
    uri: this.props.uri || "",
    uriType: this.props.uriType as MarketplaceUriType || MarketplaceUriType.None,
    protocolOptions: [
      { key: "None", text: "None" },
      { key: 'jobsDivider', text: '-', itemType: DropdownMenuItemType.Divider },
      { key: "jobsHeader", text: "Protocol Jobs", itemType: DropdownMenuItemType.Header },
    ],
  };

  public componentDidMount() {
    this.setProtocolOptions(null as any);
  }

  public render() {
    return (
      <Fabric>
        <TextField
          label="Marketplace URI"
          prefix="https://api.github.com/repos/"
          description="Endpoint should be :owner/:repo/contents/:path?ref=:branch"
          onChange={this.setMarketplaceURI}
          onBlur={this.setProtocolOptions}
        />
        <Dropdown styles={{dropdown: {width: 240}}}
          label="Shared Protocol Config Files"
          placeholder="Select a protocol config file"
          options={this.state.protocolOptions}
          onChange={this.selectProtocol}
          disabled={this.props.disabled}
        />
      </Fabric>
    );
  }

  private setMarketplaceURI = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, uri?: string) => {
    if (uri !== undefined) {
      this.setState({
        uri: `https://api.github.com/repos/${uri}`,
        uriType: MarketplaceUriType.GitHub,
      });
    }
  }

  private setProtocolOptions = async (event: React.FocusEvent<HTMLInputElement>) => {
    const protocolList = await this.getProtocolList(this.state.uri, this.state.uriType);
    if (protocolList) {
      const protocolOptions = [
        { key: "None", text: "None" },
        { key: 'jobsDivider', text: '-', itemType: DropdownMenuItemType.Divider },
        { key: "jobsHeader", text: "Protocol Jobs", itemType: DropdownMenuItemType.Header },
      ];
      for (let protocolItem of protocolList) {
        protocolOptions.push({
          key: protocolItem.name,
          text: protocolItem.name,
          data: protocolItem.uri,
        } as any);
      }
      this.setState({ protocolOptions });
    }
  }

  private selectProtocol = async (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option !== undefined) {
      await this.setState({ selectedProtocol: option });
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
    if (uriType === MarketplaceUriType.GitHub) {
      try {
        const res = await fetch(uri);
        const data = await res.json();
        if (Array.isArray(data)) {
          const protocolList: any[] = [];
          for (let item of data) {
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
