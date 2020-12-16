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
import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';
import {Stack, StackItem, SearchBox, ColorClassNames, Link, getTheme} from 'office-ui-fabric-react';
import React, {useState} from 'react';
import t from '../../components/tachyons.scss';
import {ScrollYBarStyles} from '../components/scrollbar-styles';
import {applyDrawingData} from './getJobStatus';

const {spacing} = getTheme();

function selectOneCluster(subCluster, vc) {
  cookies.set('subClusterUri', subCluster, {expires: 7});
  cookies.set('virtualClusterUri', [vc], {expires: 7});
}

const AllVirtualCluster = ({aggregatedVirtualClusters}) => {
  const [searchedVirtualClusters, setSearchedVirtualClusters] = useState(sortAndDealSubCluster(aggregatedVirtualClusters));
  const [searchedValue, setSearchedValue] = useState(null);

  function sortAndDealSubCluster(aggregatedVirtualClusters) {
    const fullSubVirtualClusters = applyDrawingData(aggregatedVirtualClusters);
    const sortedFullSubVirtualClusters = {};
    const cluster = Object.keys(fullSubVirtualClusters);
    cluster.sort(function(pre, nex) {
      return pre.localeCompare(nex);
    });
    cluster.map((virtualCluster, index) => {
      sortedFullSubVirtualClusters[virtualCluster] = fullSubVirtualClusters[virtualCluster];
    })
    return sortedFullSubVirtualClusters;
  }

  const onSearch = (newValue) => {
    if (!aggregatedVirtualClusters) {
      return null;
    }
    setSearchedValue(newValue);
    const searchedVirtualClusters = {}
    Object.keys(aggregatedVirtualClusters).filter((item, index) => {
      if (item.toLowerCase().includes(newValue.toLowerCase())) {
        searchedVirtualClusters[item] = aggregatedVirtualClusters[item];
      }
    });
    setSearchedVirtualClusters(searchedVirtualClusters);
  };

  const onClear = () => {
    setSearchedVirtualClusters(aggregatedVirtualClusters);
  };

  return (
    <Stack styles={{root: {width: '100%', height: '100%'}}} className={c(t.overflowYAuto)}>
      <StackItem
        styles={{root: {fontWeight: 600, height: 50}}}
        className={c(t.bb, ColorClassNames.neutralQuaternaryBorder, t.pa3)}
      >
        All virtual clusters
      </StackItem>
      <StackItem className={c(ColorClassNames.neutralQuaternaryBorder)} styles={{root: {height: 44}}}>
        <SearchBox
          underlined
          placeholder='Search with virtual cluster'
          value={searchedValue}
          onChange={(newValue) => onSearch(newValue)}
          onClear={onClear}
          styles={{root: {backgroundColor: 'transparent', alignSelf: 'center', padding: 6, height: '100%'}}}
          className={c(ColorClassNames.neutralLightBorder, ColorClassNames.themePrimaryBorderHover)}
        />
      </StackItem>
      <StackItem grow={1} className={c(t.overflowYAuto, t.borderBox, t.pr1)}>
        {isEmpty(searchedVirtualClusters) &&
          <Stack className={c(t.pa2, t.tc, ColorClassNames.neutralSecondary)}>
            No results matched your search.
          </Stack>
        }
        {!isEmpty(searchedVirtualClusters) &&
          (<ScrollYBarStyles>
            {
            Object.keys(searchedVirtualClusters).map((vc, index) => (
              <Stack
                key={index}
                horizontal
                horizontalAlign='start'
                className={c(t.pv2, t.ph3, ColorClassNames.neutralLighterBackgroundHover)}
                styles={{root: {backgroundColor: index % 2 !== 0 ? '#FAFAFA' : '#ffffff'}}}
              >
                <StackItem styles={{root: {width: '30%', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis'}}} className={c(t.pa1, t.darkGray)}>
                  {vc}
                </StackItem>
                <StackItem styles={{root: {width: '70%', display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse'}}}>
                  {Object.keys(searchedVirtualClusters[vc]).map((subVc, itemIndex) => (
                    <Link
                      styles={{root: {width: 160, color: 'rgb(0, 113, 188)', marginLeft: spacing.s1}}}
                      className={c(t.pv1, t.ph2, t.tr)}
                      key={itemIndex}
                      href={`./job-list.html?subCluster=${subVc}`}
                      onClick={ () => selectOneCluster(subVc, vc)}
                    >
                      {subVc}
                    </Link>)
                    )
                  }
                </StackItem>
              </Stack>
            ))
            }
          </ScrollYBarStyles>)
        }
      </StackItem>
    </Stack>
  );
};

AllVirtualCluster.propTypes = {
  aggregatedVirtualClusters: PropTypes.object.isRequired,
};

export default AllVirtualCluster;
