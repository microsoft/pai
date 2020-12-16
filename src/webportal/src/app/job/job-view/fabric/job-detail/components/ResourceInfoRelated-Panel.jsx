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

import c from 'classnames';
import { ColorClassNames, Panel, PanelType, Stack, CommandBar, CommandBarButton, concatStyleSets, memoizeFunction} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../../../../components/tachyons.scss';
export default class ResourceInfoRelatedPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { jobInfo, vcInfo, resourceRequests, header, footer, onDismiss } = this.props;
    let resourceRelatedWarning = this.props.resourceRelatedWarning;
    const sectionHeader = {
      'fontFamily': 'monospace',
      'color': '#5BD75B',
      'fontSize': '18px'
    };
    const warningSectionHeader = {
      'fontFamily': 'monospace',
      'color': '#FFA333',
      'fontSize': '18px'
    };
    const tableStyle = {
      'borderCollapse': 'separate',
      'borderSpacing': '8px',
      'width': '100%',
      'border': '1px solid #ccc',
    };

    let overUsedPartitions = [];
    const length = (vcInfo && vcInfo.capacityAndResourceInfo) ? vcInfo.capacityAndResourceInfo.length : 0;
    for (let i = 0; i < length; i++) {
      if (vcInfo.capacityAndResourceInfo[i].usedCapacity >= 100) {
        overUsedPartitions.push(vcInfo.capacityAndResourceInfo[i].label);
      }
    }

    // generate warning information
    const warningInfoSection = `[Warning!!!]`;
    const overUsedPartitionsString = overUsedPartitions.join(', ');
    let warningInfo = [];
    if (overUsedPartitionsString && (jobInfo.jobStatus.state === 'WAITING' || jobInfo.jobStatus.state === 'RUNNING')) {
      warningInfo.push(`### Application's virtual cluster '${jobInfo.jobStatus.virtualCluster}' is overusing capacity at ${overUsedPartitionsString} partitions, this may lead to `);
      if (jobInfo.jobStatus.pendingContaines > 0) {
        warningInfo.push(`resource allocation get delayed. `);
      }

      if (jobInfo.jobStatus.runningContianers > 0) {
        warningInfo.push(`running contianers get preempted/killed.`);
      }
    }
    let totalPreemptedContianers = 0;
    if (jobInfo.jobStatus.preemptedResourceMB > 0) {
      totalPreemptedContianers = jobInfo.jobStatus.numNonAMContainerPreempted + jobInfo.jobStatus.numAMContainerPreempted;
    }

    // generate Outstanding Resource Requests detail information section
    const resourceRequestsSection = `[Outstanding Resource Requests details]`;

    // generate preemption metrics Information, show these information only when preemptions happpen
    let preemptionSection = `[Application Preemption Metrics]`;
    let preemptionInfo = [];
    if (jobInfo.jobStatus.preemptedMemorySeconds > 0) {
      preemptionInfo.push(`  Total Resource Preempted: <memory:${jobInfo.jobStatus.preemptedResourceMB}, vCores: ${jobInfo.jobStatus.preemptedResourceVCores}>`);
      preemptionInfo.push(`  Total Number of Non-AM Containers Preempted: ${jobInfo.jobStatus.numNonAMContainerPreempted}`);
      preemptionInfo.push(`  Total Number of AM Containers Preempted: ${jobInfo.jobStatus.numAMContainerPreempted}`);
      preemptionInfo.push(`  Aggregate Preempted Resource Allocation: ${jobInfo.jobStatus.preemptedMemorySeconds} MB-seconds, ${jobInfo.jobStatus.preemptedVcoreSeconds} Vcore-seconds`);
    }
    
    let queueUsageInfoSection = `[Virtual Cluster '${jobInfo.jobStatus.virtualCluster}' resourceUsage details]`;
    let vcLink = `${window.location.protocol}//${window.location.host}/virtual-clusters.html?subCluster=${cookies.get('subClusterUri')}#vcName=${jobInfo.jobStatus.virtualCluster}`;
    if (!jobInfo.jobStatus.virtualCluster) {
      queueUsageInfoSection = `[Virtual Clusters ResourceUsage Details]`;
      vcLink = `${window.location.protocol}//${window.location.host}/virtual-clusters.html?subCluster=${cookies.get('subClusterUri')}`;
    }

    const mdmYarnLinkDispaly = `https://jarvis-west.dc.ad.msft.net/dashboard/mtp-prod/Overview/YARN`;
    const mdmYarnLink = `https://jarvis-west.dc.ad.msft.net/dashboard/mtp-prod/Overview/YARN?overrides=[{%22query%22:%22//*[id=%27Queue%27]%22,%22key%22:%22value%22,%22replacement%22:%22${jobInfo.jobStatus.virtualCluster}%22}]%20`;
  

    let replacedResourceRequests = [];
    if (resourceRequests) {
      replacedResourceRequests =  resourceRequests.length >= 0 ? resourceRequests : [resourceRequests];
      for (let i = 0; i < replacedResourceRequests.length; i++) {
        let diagnostics = [];
        let shouldWarningForRequest = false;
        
        let tempDiagnostics = ""; 
        if (replacedResourceRequests[i].capacityInfo.totalMatchingNodesCount <= 0) {
          tempDiagnostics = `There is no node matching #${i+1} request , please check if you set right NodeLabelExpresssion, or if the Capability is too big`;
          shouldWarningForRequest = true;
          resourceRelatedWarning = true;
          warningInfo.push(`### ${tempDiagnostics}`);
        } else {
          if (replacedResourceRequests[i].capacityInfo.totalAvailNodesCount <= 0) {
            tempDiagnostics = `Currently there is no node which can accommodate this request, `
            tempDiagnostics = jobInfo.jobStatus.reservedContainers > 0 ? (tempDiagnostics + 'but ') : tempDiagnostics;
          } else {
            tempDiagnostics = `Currently there are total ${replacedResourceRequests[i].capacityInfo.totalAvailNodesCount} nodes which can accommodate this request, `;
            tempDiagnostics = jobInfo.jobStatus.reservedContainers > 0 ? (tempDiagnostics + 'and ') : tempDiagnostics;
          }

          if (jobInfo.jobStatus.reservedContainers > 0) {
            tempDiagnostics += ` ${jobInfo.jobStatus.reservcedVCores/replacedResourceRequests[i].capability.vCores} containers are already reserved for this application, `;
            tempDiagnostics += `normally decreasing the Capability of the request can help get request allocated more easily. `;
          } 

          if (overUsedPartitions.length > 0) {
            shouldWarningForRequest = true;
            tempDiagnostics += `BTW application's virtual cluster ${jobInfo.jobStatus.virtualCluster} is overusing capacity, the resource allocation may get delayed`;
          }
        }

        diagnostics.push(tempDiagnostics);
        replacedResourceRequests[i].capacityInfo.diagnostics = diagnostics.join(`\n`);
        replacedResourceRequests[i].capacityInfo.shouldWarning = shouldWarningForRequest;
      }
    }

    function getHeaderTitle() {
      return {
        key: 'ResourceInfoRelatedPanel',
        name: 'ResourceInfoRelatedPanel',
        text: 'Job Resource Requests and Preemption Metrics',
        buttonStyles: {root: { height: '100%'}},
        iconProps: {
          iconName: 'Source',
        },
      };
    }
  
    function  getClose() {
      return {
        key: 'close',
        name: 'Close',
        buttonStyles: {root: { height: '100%', color: 'white'}},
        iconOnly: true,
        iconProps: {
          iconName: 'Cancel',
        },
        onClick() {
          onDismiss();
        },
      };
    }
    const headerTitleItems = [getHeaderTitle()];
    const headerCloseFarItems = [getClose()];

    
    const CustomButton= props => {
      const itemStyles = { label: { fontSize: 18 } };
      const getCommandBarButtonStyles = memoizeFunction(
        (originalStyles) => {
          if (!originalStyles) {
            return itemStyles;
          }
          return concatStyleSets(originalStyles, itemStyles);
        },
      );
      return <CommandBarButton {...props} styles={getCommandBarButtonStyles(props.styles)} />;
    };

    return (
      <div>
        <Panel
          onDismiss={onDismiss}
          isLightDismiss={true}
			    hasCloseButton={false}
          isOpen={this.props.isOpen}
          type={PanelType.large}
          styles={{
            overlay: [ColorClassNames.blackTranslucent40Background],
            content: [t.flex, t.flexAuto, t.flexColumn, {padding: '0!important'}],
            scrollableContent: [t.flex, t.flexAuto, { overflowY: 'visible' }],
          }}
        >
          <Stack className={c(t.pb3)}>
            <CommandBar
              items={headerTitleItems}
              farItems={headerCloseFarItems}
              styles={{root: {padding: 0, width: '100%', height: 50}}}
              buttonAs={CustomButton}
            />
          </Stack>
          { header && <div className={c(t.mb4, t.flex) }>
            {header}
          </div>}
          <div className={c(t.flexAuto, t.flex, t.flexColumn, t.mh3)} style={{ flex: '1 1 100%', minHeight: 0}}>
            {resourceRelatedWarning && (
              <div className={c(t.pb4)}>
                <div style={warningSectionHeader} className={c(t.pb1)}>{warningInfoSection}</div>
                {
                  warningInfo.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))
                }
              </div>
            )}
            { (jobInfo.jobStatus.preemptedResourceMB > 0) &&
              <div className={c(t.pb4)}>
                <span>### Util now, total {totalPreemptedContianers} containers are preempted, too much preemptions may slow down your application. You can go to </span>
                <a href={mdmYarnLink} target="_blank"  rel="noopener noreferrer nofollow" style = {{color: 'rgb(0, 113, 188)'}}>{mdmYarnLinkDispaly}</a>
                <span>to check your virtual cluster historical resource usage. </span>
              </div>
            }
            <div className={c(t.pb4)}>
              <div style={sectionHeader} className={c(t.pb1)}>{resourceRequestsSection}</div>
              { replacedResourceRequests && (replacedResourceRequests.length > 0) &&
                  <table id='resourceRequestsTable' style={tableStyle} align='left'>
                    <thead>
                      <tr style={{ height: '30px' }}>
                        <th align="left" className={c(t.fw5)}>#Id</th>
                        <th align="left" className={c(t.fw5)}>Priority</th>
                        <th align="left" className={c(t.fw5)}>ResourceName</th>
                        <th align="left" className={c(t.fw5)}>Capability</th>
                        <th align="left" className={c(t.fw5)}>NumContianers</th>
                        <th align="left" className={c(t.fw5)}>RelaxLocality</th>
                        <th align="left" className={c(t.fw5)}>NodeLabelExpresssion</th>
                        <th aligh="left" className={c(t.fw5)}>Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {replacedResourceRequests.map((item, index) => (
                        <tr style={{ height: '30px' }} key={index}>
                          <td align="left">#{index + 1}</td>
                          <td align="left">{item.priority}</td>
                          <td align="left">{item.resourceName}</td>
                          <td align="left">{JSON.stringify(item.capability)}</td>
                          <td align="left">{item.numContainers}</td>
                          <td align="left">{JSON.stringify(item.relaxLocality)}</td>
                          <td align="left" style={{wordBreak: "break-all"}}> {item.nodeLabelExpression}</td>
                          <td align="left" style={{wordBreak: "break-all"}}> 
                          {item.capacityInfo.diagnostics.split("\n").map((diagnostics, index1) => (
                            (item.capacityInfo.shouldWarning) && <span style={{color: '#FFA333'}}>{diagnostics} <br /></span>
                            || (!item.capacityInfo.shouldWarning) && <span>{diagnostics} <br /></span>
                            ))
                          }
                          </td>
                        </tr>
                      ))
                      }
                    </tbody>
                  </table>
              }
              { (!resourceRequests || resourceRequests.length == 0) &&
                <div>No Pending Resource Requests</div>
              }
            </div>
            {jobInfo.jobStatus.preemptedMemorySeconds > 0 && (
              <div className={c(t.pb4)}>
                <div style={sectionHeader}>{preemptionSection}</div>
                {
                  preemptionInfo.map((item, index) => (
                    <span key={index} style={{'padding': '4px 0px 4px 0px'}}>{item}</span>
                  ))
                }
              </div>
            )}
            <div className={c(t.pb4)}>
              <div style={sectionHeader} className={c(t.pb1)}>{queueUsageInfoSection}</div>
              { vcInfo && vcInfo.capacityAndResourceInfo &&
                <table id='queueResourceUsageTable' style={tableStyle} align='left'>
                  <thead>
                    <tr style={{ height: '30px' }}>
                      <th align="left" className={c(t.fw5)}>Label</th>
                      <th align="left" className={c(t.fw5)}>ResourcesConfigured</th>
                      <th align="left" className={c(t.fw5)}>ResourcesAllocated</th>
                      <th align="left" className={c(t.fw5)}>UsedCapacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    { vcInfo.capacityAndResourceInfo.map((item, index) => (
                      <tr style={{ height: '30px' }} key={index}>
                        <td align="left">{item.label ? item.label : 'DEFAULT_PARTITION'}</td>
                        <td align="left">{JSON.stringify(item.resourcesConfigured)}</td>
                        <td align="left">{JSON.stringify(item.resourcesAllocated)}</td>
                        {(item.usedCapacity >= 100) && <td style={{color: '#FFA333'}} align="left">{item.usedCapacity}%</td>}
                        {(item.usedCapacity < 100) && <td align="left">{item.usedCapacity}%</td>}
                      </tr>
                    ))
                    }
                  </tbody>
                </table>
              }
            </div>
            <div className={c(t.pb4)}>
              <span> Go to </span>
              <a href={vcLink} target="_blank" rel="noopener noreferrer nofollow" style = {{color: 'rgb(0, 113, 188)'}}>{vcLink}</a>
              <span> to check detailed virtual cluster resource usage information. </span>
            </div>
            <div className={c(t.mt4, t.flex, t.justifyBetween)}>
              <div>
                {footer}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }
}

ResourceInfoRelatedPanel.propTypes = {
  jobInfo: PropTypes.object.isRequired,
};

