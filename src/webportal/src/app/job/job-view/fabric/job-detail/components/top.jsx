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

import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {Stack, DefaultButton, ActionButton, ColorClassNames, Pivot, PivotItem, PivotLinkFormat, PivotLinkSize, TooltipHost, PrimaryButton, Icon, FontClassNames} from 'office-ui-fabric-react';

import t from '../../../../../components/tachyons.scss';
import c from 'classnames';
import {isEmpty} from 'lodash';
import querystring from 'querystring';
import PropTypes from 'prop-types';
import {getHumanizedJobStateString} from '../../../../../components/util/job';
import {statusColor} from '../../../../../components/theme';

const params = new URLSearchParams(window.location.search);
const subCluster = params.get('subCluster');

const Top = ({jobInfo, jobGroupApplication, setCurJobInfo, onStopAllJob}) => {
  const [pivotItemWidth, setPivotItemWidth] = useState(null);
  const appId = !isEmpty(jobInfo) ? jobInfo.jobStatus.appId : params.get('appId');

  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });
  window.addEventListener('resize', layout);

  function layout() {
    getPivotItemWidth();
  }

  const getPivotItemWidth = useCallback(() => {
    const pivotWidth = $(`.content-wrapper #content-wrapper .job-detail-topPivot`).width() - 260;
    const pivotItemWidth = !isEmpty(jobGroupApplication) ? parseInt(pivotWidth / jobGroupApplication.length) : 0;
    setPivotItemWidth(pivotItemWidth);
  });

  useEffect(()=> getPivotItemWidth(), []);

  function getCurSelectIndex() {
    if (!isEmpty(jobGroupApplication) ) {
      const curChooseItem = jobGroupApplication.find((item) => item.appId === appId);
      const chooseIndex = jobGroupApplication.indexOf(curChooseItem);
      return chooseIndex;
    } else {
      return -1;
    }
  }

  function getJobStatusColorByStatusString(statusString) {
    switch(statusString) {
      case 'Waiting':
        return statusColor.waiting;
      case 'Preparing':
        return statusColor.waiting;
      case 'Running':
        return statusColor.running;
        case 'Finishing':
        return statusColor.running;
      case 'Succeeded':
        return statusColor.succeeded;
      case 'Stopping':
        return statusColor.waiting;
      case 'Stopped':
        return statusColor.unknown;
      case 'Failed':
        return statusColor.failed;
      case 'Unknown':
        return statusColor.unknown;
      case 'Archived':
        return statusColor.succeeded;
      default:
        return null;
    }
  }

  {/* render Pivot Item */}
  function _customRenderer(link, defaultRenderer, len) {
    const idx = getCurSelectIndex();
    const background = getJobStatusColorByStatusString(link.status);
    return (
      <div style={{display: 'flex', overflow: 'hidden', alignItems: 'center'}} className={ link.itemKey === 1 ? c(t.pl2) : c(t.pl4) } title={len > 40 ? link.headerText : ''}>
        <Icon
          iconName='CircleShapeSolid'
          styles={{root: {fontSize: 10, lineHeight: '100%', paddingTop: 2, paddingRight: 4, color: background}}}
          />
        <span
          style={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontWeight: link.itemKey === (idx + 1) ? 600 : 400,
          }}
          >
          {defaultRenderer(link)}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            top: 0,
            right: -10,
            borderRadius: '8px',
            zIndex: 20,
            position: 'absolute',
            transform: 'rotate(45deg)',
          }}
          className={
            link.itemKey === idx || link.itemKey === (idx + 1) ?
            c(t.bt, t.br, t.bw1L, ColorClassNames.themeDarkAltBorder) :
            c(t.bt, t.br, ColorClassNames.neutralQuaternaryBorder)
          }
          ></div>
        <TooltipHost content={link.headerText} >
          <div
            style={{width: '100%', height: '100%', position: 'absolute'}}
            className={ link.itemKey === idx + 1 ?
              c(t.absoluteFill, t.bt, t.bb, t.bw1L, ColorClassNames.themeDarkAltBorder) :
              c(t.absoluteFill, t.bt, t.bb, ColorClassNames.neutralQuaternaryBorder)
            }
            ></div>
        </TooltipHost>
      </div>
    );
  }

  {/* on Pivot Item click */}
  function onLinkClick(item) {
    setCurJobInfo(item.props.jobDetailLink);
  }

  function ableCanStopAll() {
    const StoppableStatus = [
      'Preparing',
      'Running',
      'Waiting',
    ];
    const canStopJob = jobGroupApplication.find((item) => {
      return StoppableStatus.includes(getHumanizedJobStateString(item));
    })
    return isEmpty(canStopJob);
  }

  {/* sort by the time stamp */}
  jobGroupApplication.sort((pre, nex) => pre.createdTime - nex.createdTime);

  return (
    <Stack horizontal horizontalAlign='space-between' styles={{root: {alignItems: 'center'}}} className={c(t.w100, t.overflowYHidden, 'job-detail-topPivot')} >
      {/*  Back to Jobs */}
      <Stack >
        <ActionButton
          styles={{root: {width: 120}}}
          iconProps={{iconName: 'revToggleKey'}}
          href= {`/job-list.html?${querystring.stringify({
            subCluster: subCluster,
          })}`}
          >
          Back to jobs
        </ActionButton>
      </Stack>
      {/* job group tab */}
      <Stack grow={1} >
        <Pivot
          linkFormat={PivotLinkFormat.links}
          linkSize={PivotLinkSize.normal}
          selectedKey={null}
          onLinkClick={onLinkClick}
          styles={{
            root: getCurSelectIndex() === 0 ?
              [t.bl, t.bw1L, ColorClassNames.themeDarkAltBorder, t.overflowHidden, {borderRadius: '6px', paddingRight: '20px!important'}] :
              [t.bl, t.bw1L, ColorClassNames.neutralQuaternaryBorder, t.overflowHidden, {borderRadius: '6px', paddingRight: '20px!important'}],
            link: [{margin: '0!important', padding: '0', width: pivotItemWidth, maxWidth: 300, height: 34}],
            }}
          >
          {jobGroupApplication.map((item, index) => (
            <PivotItem
              headerText={item.name}
              jobDetailLink={item.jobDetailLink}
              itemKey={index + 1}
              key={index}
              status={getHumanizedJobStateString(item)}
              className={c(t.ma0, t.pa0)}
              onRenderItemLink={(...args)=> _customRenderer(...args, jobGroupApplication.length)}
              >
            </PivotItem>
          ))}
        </Pivot>
      </Stack>
      {/* stop all job */}
      {jobGroupApplication.length >= 1 && (
        <Stack className={c(t.pl2)}>
          <DefaultButton
            styles={{root: {width: 80, padding: 8}}}
            className={c(ColorClassNames.neutralQuaternaryAltBackground)}
            text='Stop All'
            onClick={onStopAllJob}
            disabled={ableCanStopAll()}
          />
        </Stack>
      )}
    </Stack>
  );
};

Top.propTypes = {
  jobInfo: PropTypes.object.isRequired,
  jobGroupApplication: PropTypes.array.isRequired,
  setCurJobInfo: PropTypes.func.isRequired,
  onStopAllJob: PropTypes.func.isRequired,
};

export default Top;
