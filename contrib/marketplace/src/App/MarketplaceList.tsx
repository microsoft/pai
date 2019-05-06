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
  DefaultButton, DocumentCard, DocumentCardActions, DocumentCardActivity, DocumentCardLogo,
  DocumentCardStatus, DocumentCardTitle, DefaultPalette, Fabric, Icon, IconButton, Label,
  Panel, PanelType, Persona, PersonaSize, Stack, Spinner, SpinnerSize, Text, TextField,
  initializeIcons, mergeStyleSets,
} from "office-ui-fabric-react";
import yaml from "yaml";

import monacoStyles from "./monaco.scss";

const MonacoEditor = lazy(() => import("react-monaco-editor"));
const styles = mergeStyleSets({
  title: {
    marginTop: "15px",
    fontWeight: "600",
  },

  subTitle: {
    fontSize: "16px",
    fontWeight: "300",
    color: DefaultPalette.neutralSecondary,
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

type MarketplaceUriType = ("GitHub" | null);
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
  raw: string;
}

interface IMarketplaceListProps {
  api: string;
  user: string;
  token: string;
  submissionId?: string;
  defaultURI: string;
  defaultURIType: MarketplaceUriType;
}

interface IMarketplaceListState {
  uri: string;
  uriType: MarketplaceUriType;
  protocols: Array<IProtocol | null>;
  loading: boolean;
  showEditor: boolean;
  editorYAML: string;
  layout: LayoutType;
}

export default class MarketplaceList extends React.Component<IMarketplaceListProps, IMarketplaceListState> {
  public static defaultProps: Partial<IMarketplaceListProps> = {
    defaultURI: "https://api.github.com/repos/Microsoft/pai/contents/marketplace-v2",
    defaultURIType: "GitHub",
  };

  public state = {
    uri: this.props.defaultURI,
    uriType: this.props.defaultURIType,
    protocols: [],
    loading: true,
    showEditor: false,
    editorYAML: "",
    layout: "list" as LayoutType,
  };

  public componentDidMount() {
    this.getProtocols();
  }

  public render() {
    return (
      <Fabric>
        <Stack>
          <Stack horizontal={true} horizontalAlign="center" padding={15}>
            <Text variant="xxLarge" nowrap={true} block={true} className={styles.title}>
              Marketplace <span className={styles.subTitle}>Protocol Preview</span>
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
        <Stack className={styles.layoutOption}>
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
                <IconButton
                  iconProps={{ iconName: "FavoriteStar" }}
                  title="Star protocol job"
                  ariaLabel="Star protocol job"
                  onClick={this.starProtocol}
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
      initials: this.getProfileInitials(protocol.contributor),
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
      {
        iconProps: { iconName: "FavoriteStar" },
        ariaLabel: "Star protocol job",
        onClick: this.starProtocol,
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
      sessionStorage.setItem("protocolYAML", protocol.raw);
      window.open(`/plugin.html?op=init&index=${this.props.submissionId}`);
    }
  }

  private starProtocol = () => {
    window.open("https://github.com/Microsoft/pai/tree/master/marketplace-v2");
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

  private getProfileInitials = (contributor: string) => {
    return contributor.split(" ").map((name: string) => name[0]).join(".").toUpperCase();
  }

  private getProtocols = async () => {
    const protcolList = await this.getProtocolList(this.state.uri, this.state.uriType);
    if (protcolList !== null) {
      let protocols = await Promise.all(protcolList.map(async (item: IProtocolItem) => {
        return await this.getProtocolItem(item.uri);
      }));
      protocols = await protocols.filter((x) => x != null);
      this.setState({
        protocols,
        loading: false,
      });
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

  private getProtocolItem = async (uri: string) => {
    try {
      const res = await fetch(uri);
      const data = await res.text();
      const protocol = yaml.parse(data);
      return {
        name: protocol.name,
        contributor: protocol.contributor,
        description: protocol.description,
        prerequisitesNum: protocol.prerequisites.length,
        raw: data,
      } as IProtocol;
    } catch (err) {
      return null;
    }
  }
}
