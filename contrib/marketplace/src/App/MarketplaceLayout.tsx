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

import React, { Suspense, lazy } from "react";
import {
  Callout, DefaultButton, DocumentCard, DocumentCardActions, DocumentCardActivity, DocumentCardLogo,
  DocumentCardStatus, DocumentCardTitle, DefaultPalette, Fabric, Icon, IconButton, Label,
  Panel, PanelType, Persona, PersonaSize, Stack, Spinner, SpinnerSize, Text, TextField,
  initializeIcons, mergeStyleSets, PrimaryButton,
} from "office-ui-fabric-react";
import Cookies from "js-cookie";
import yaml from "js-yaml";

import monacoStyles from "./monaco.scss";

const MonacoEditor = lazy(() => import("react-monaco-editor"));
const styles = mergeStyleSets({
  title: {
    marginTop: "15px",
    fontWeight: "600",
  },

  textfiled: {
    width: 480,
  },

  layoutOption: {
    width: "95%",
    alignSelf: "center",
    height: "40px",
  },

  sep: {
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: DefaultPalette.neutralLight,
  },

  layout: {
    width: "95%",
    marginTop: "20px",
    marginBottom: "30px",
    alignSelf: "center",
    boxSizing: "border-box",
    borderStyle: "1px solid rgba(0, 0, 0, 0.2)",
    backgroundColor: DefaultPalette.white,
  },

  gridCell: {
    display: "inline-block",
    width: 240,
  },

  gridTitle: {
    height: 150,
  },

  listCell: {
    display: "flex",
    width: "100%",
    minHeight: "54px",
    paddingBottom: "10px",
    boxSizing: "border-box",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: DefaultPalette.neutralLight,
    selectors: {
      "&:hover": {
        backgroundColor: DefaultPalette.neutralLighterAlt,
      },
    },
  },

  listCellIconItem: {
    width: "4%",
  },

  listCellTextItem: {
    width: "96%",
  },

  listCellIcon: {
    fontWeight: "400",
    color: DefaultPalette.themePrimary,
  },

  listCellTitle: {
    fontWeight: "400",
    fontSize: "17px",
  },

  listCellIconButtons: {
    width: "75%",
  },

  listCellDescription: {
    color: DefaultPalette.white,
    selectors: {
      "&:disabled": {
        color: DefaultPalette.white,
      },
    },
  },
});

initializeIcons();

type MarketplaceUriType = ("GitHub" | "DevOps" | null);
type LayoutType = ("grid" | "list");

interface IProtocolItem {
  name: string;
  uri: string;
}

interface IProtocol {
  name: string;
  contributor: string;
  description: string;
  prerequisitesNum: number;
  itemKey: string;
  raw: string;
}

interface IMarketplaceLayoutProps {
  api: string;
  user: string;
  token: string;
  submissionId?: string;
  defaultURI: string;
  defaultURIType: MarketplaceUriType;
  defaultURIToken: string;
}

interface IMarketplaceLayoutState {
  uri: string;
  uriType: MarketplaceUriType;
  uriToken: string;
  protocols: Array<IProtocol | null>;
  loading: boolean;
  showEditor: boolean;
  uriConfigCallout: boolean;
  editorYAML: string;
  layout: LayoutType;
}

export default class MarketplaceLayout extends React.Component<IMarketplaceLayoutProps, IMarketplaceLayoutState> {
  public static defaultProps: Partial<IMarketplaceLayoutProps> = {
    defaultURI: "https://api.github.com/repos/Microsoft/pai/contents/marketplace-v2",
    defaultURIType: "GitHub",
    defaultURIToken: "",
  };

  public state = {
    uri: this.props.defaultURI,
    uriType: this.props.defaultURIType,
    uriToken: this.props.defaultURIToken,
    protocols: [],
    loading: true,
    showEditor: false,
    uriConfigCallout: false,
    editorYAML: "",
    layout: "grid" as LayoutType,
  };

  private uriConfigCalloutBtn = React.createRef<HTMLDivElement>();

  public componentDidMount() {
    this.getProtocols();
  }

  public render() {
    return (
      <Fabric>
        <Stack>
          <Stack horizontal={true} horizontalAlign="center" padding={15}>
            <Text variant="xxLarge" nowrap={true} block={true} className={styles.title}>
              Marketplace
            </Text>
          </Stack>
          {this.state.loading ? this.renderLoading() : this.renderContent()}
        </Stack>
      </Fabric>
    );
  }

  private renderLoading = () => {
    return (
      <Stack>
        <Spinner
          label="Loading Marketplace ..."
          ariaLive="assertive"
          labelPosition="left"
          size={SpinnerSize.large}
        />
      </Stack>
    );
  }

  private renderContent = () => {
    const editorSpinner = (
      <Spinner
        label="Loading YAML Editor ..."
        ariaLive="assertive"
        labelPosition="left"
        size={SpinnerSize.large}
      />
    );

    return (
      <>
        <Stack horizontal={true} horizontalAlign="space-between" className={styles.layoutOption}>
          <Stack horizontal={true} horizontalAlign="start">
            <Label>Config URI : </Label>
            <div ref={this.uriConfigCalloutBtn}>
              <IconButton
                iconProps={{ iconName: "ConfigurationSolid" }}
                title="Config Marketplace URI"
                ariaLabel="Config Marketplace URI"
                onClick={this.toggleConfigCallout}
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
          <Stack horizontal={true} horizontalAlign="end">
            <Label>Change View : </Label>
            <IconButton
              className={styles.sep}
              iconProps={{ iconName: "GridViewSmall" }}
              title="View in Grid"
              ariaLabel="View in Grid"
              onClick={this.changeGridView}
            />
            <IconButton
              iconProps={{ iconName: "List" }}
              title="View in List"
              ariaLabel="View in List"
              onClick={this.changeListView}
            />
          </Stack>
        </Stack>

        <Panel
          isOpen={this.state.showEditor}
          isLightDismiss={true}
          onDismiss={this.closeEditor}
          type={PanelType.largeFixed}
          headerText="Protocol YAML Editor"
        >
          <Stack gap={20}>
            <Stack className={monacoStyles.monacoHack}>
              <Suspense fallback={editorSpinner}>
                <MonacoEditor
                  width={800}
                  height={800}
                  value={this.state.editorYAML}
                  language="yaml"
                  theme="vs-dark"
                  options={{ wordWrap: "on", readOnly: true }}
                />
              </Suspense>
            </Stack>
            <Stack gap={20} horizontal={true}>
              <DefaultButton text="Close" onClick={this.closeEditor} />
            </Stack>
          </Stack>
        </Panel>

        {this.renderLayout()}
      </>
    );
  }

  private renderLayout = () => {
    const renderItem = (protocol: IProtocol, index: number) => {
      if (this.state.layout === "list") {
        return this.renderListItem(protocol, index);
      } else {
        return this.renderGridItem(protocol, index);
      }
    };

    return (
      <Stack padding={25} className={styles.layout}>
        <Stack horizontal={true} horizontalAlign="center" wrap={true} tokens={{childrenGap: "20 20"}}>
          {this.state.protocols.map((protocol: IProtocol, index: number) => renderItem(protocol, index))}
        </Stack>
      </Stack>
    );
  }

  private renderListItem = (protocol: IProtocol, index: number) => {
    return (
      <Stack key={index} className={styles.listCell}>
        <Stack horizontal={true} horizontalAlign="start" verticalAlign="start" padding={10}>
          <Stack.Item grow={4} className={styles.listCellIconItem}>
            <Text variant="xxLarge" nowrap={true} block={true} className={styles.listCellIcon}>
              <Icon iconName="FileYML" />
            </Text>
          </Stack.Item>
          <Stack.Item grow={96} className={styles.listCellTextItem}>
            <Stack horizontal={true} horizontalAlign="space-between" verticalAlign="center">
              <Text variant="xxLarge" nowrap={true} block={true} className={styles.listCellTitle}>
                {protocol.name}
              </Text>
              <Stack
                horizontal={true}
                horizontalAlign="start"
                verticalAlign="center"
                className={styles.listCellIconButtons}
              >
                <IconButton
                  iconProps={{ iconName: "View" }}
                  title="View protocol job"
                  ariaLabel="View protocol job"
                  onClick={this.viewProtocol(protocol)}
                />
                <IconButton
                  iconProps={{ iconName: "Share" }}
                  title="Submit protocol job"
                  ariaLabel="Submit protocol job"
                  onClick={this.submitProtocol(protocol)}
                />
              </Stack>
              <Persona
                size={PersonaSize.size32}
                text={protocol.contributor}
                secondaryText={`Shared on ${this.state.uriType}`}
                imageUrl={this.getProfileImage(protocol.contributor)}
              />
            </Stack>
            <TextField
              className={styles.listCellDescription}
              rows={5}
              label="Description:"
              multiline={true}
              resizable={false}
              readOnly={true}
              defaultValue={protocol.description}
            />
          </Stack.Item>
        </Stack>
      </Stack>
    );
  }

  private renderGridItem = (protocol: IProtocol, index: number) => {
    const people = [{
      name: protocol.contributor,
      profileImageSrc: this.getProfileImage(protocol.contributor),
    }];
    const cardActions = [
      {
        iconProps: { iconName: "View"  },
        ariaLabel: "View protocol job",
        onClick: this.viewProtocol(protocol),
      },
      {
        iconProps: { iconName: "Share" },
        ariaLabel: "Submit protocol job",
        onClick: this.submitProtocol(protocol),
      },
    ];

    return (
      <DocumentCard key={index} className={styles.gridCell}>
        <DocumentCardLogo logoIcon="FileYML" />
        <div className={styles.gridTitle}>
          <DocumentCardTitle title={protocol.name} shouldTruncate={true} />
          <DocumentCardTitle title={protocol.description} shouldTruncate={true} showAsSecondaryTitle={true} />
          <DocumentCardStatus statusIcon="attach" status={` ${protocol.prerequisitesNum} Prerequisite(s)`} />
        </div>
        <DocumentCardActivity activity={`Shared on ${this.state.uriType}`} people={people} />
        <DocumentCardActions actions={cardActions} />
      </DocumentCard>
    );
  }

  private toggleConfigCallout = () => {
    this.setState({uriConfigCallout: !this.state.uriConfigCallout});
  }

  private applyConfigCallout = () => {
    this.getProtocols();
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

  private viewProtocol = (protocol: IProtocol) => () => {
    this.setState({
      showEditor: true,
      editorYAML: protocol.raw,
    });
  }

  private submitProtocol = (protocol: IProtocol) => () => {
    if (this.props.submissionId == null) {
      alert("Cannot find protocol submission plugin.");
    } else {
      sessionStorage.setItem("protocolItemKey", protocol.itemKey);
      sessionStorage.setItem("protocolYAML", protocol.raw);
      window.open(`/plugin.html?op=init&index=${this.props.submissionId}`);
    }
  }

  private closeEditor = () => {
    this.setState({ showEditor: false });
  }

  private changeListView = () => {
    this.setState({layout: "list"});
  }

  private changeGridView = () => {
    this.setState({layout: "grid"});
  }

  private getProfileImage = (contributor: string) => {
    if (contributor === "OpenPAI") {
      return "https://raw.githubusercontent.com/Microsoft/pai/master/pailogo.jpg";
    } else {
      return "";
    }
  }

  private getProtocols = async () => {
    const api = await this.formatMarketplaceURI(this.state.uri);
    const protcolList = await this.getProtocolList(api, this.state.uriType);
    if (protcolList !== null) {
      let protocols = await Promise.all(protcolList.map(async (item: IProtocolItem) => {
        return await this.getProtocolItem(item);
      }));
      protocols = await protocols.filter((x) => x != null);
      this.setState({
        protocols,
        loading: false,
      });
      Cookies.set("marketplace", {
        uri: this.state.uri,
        type: this.state.uriType,
        token: this.state.uriToken,
      });
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

  private getProtocolItem = async (item: IProtocolItem) => {
    const requestHeaders: HeadersInit = new Headers();
    if (this.state.uriToken) {
      requestHeaders.set(
        "Authorization",
        `Basic ${new Buffer(this.state.uriToken).toString("base64")}`,
      );
    }
    try {
      const res = await fetch(item.uri, {headers: requestHeaders});
      const data = await res.text();
      const protocol = yaml.safeLoad(data);
      return {
        name: protocol.name,
        contributor: protocol.contributor,
        description: protocol.description,
        prerequisitesNum: protocol.prerequisites.length,
        itemKey: item.name,
        raw: data,
      } as IProtocol;
    } catch (err) {
      return null;
    }
  }
}
