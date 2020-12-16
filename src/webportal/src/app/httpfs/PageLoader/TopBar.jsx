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

import React, {useContext, useState, useEffect} from 'react';
import c from 'classnames'
import t from 'tachyons-sass/tachyons.scss';
import $ from 'jquery';

import {getTheme, ColorClassNames} from '@uifabric/styling';
import {CommandBarButton} from 'office-ui-fabric-react/lib/Button';
import {SearchBox} from 'office-ui-fabric-react/lib/SearchBox';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ContextualMenuItemType, getSubmenuItems} from 'office-ui-fabric-react/lib/ContextualMenu';

import {getSubClusters} from '../../home/home/util';
import {restServerClient, defaultRestServerClient} from '../../common/http-client';


/* eslint-disable react/prop-types */
function FilterButton({defaultRender: Button, ...props}) {
  const {subMenuProps: {items}} = props;
  const checkedItems = items.filter((item) => item.checked).map((item) => item.text);
  const checkedText = checkedItems.length === 0 ? null
    : checkedItems.length === 1 ? <strong>{checkedItems[0]}</strong>
    : <strong>{checkedItems[0]}{` (+${checkedItems.length - 1})`}</strong>;
  return (
    <Button {...props}>
      {checkedText}
    </Button>
  );
}

/* eslint-enable react/prop-types */

function TopBar() {
  const [subClustersList, setsubClustersList]= useState('');

  useEffect(() => {
    //setsubClustersList(getSubClusters());
    // for compl user
    setsubClustersList(["MTCmpl-PROD-CO4-0"]);
  }, []);

  /**
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function listSubClusters() {

    function onClick(event, {key}) {
      cookies.set('subClusterUri', key, {expires: 7});
      const params = new URLSearchParams(window.location.search);
      if (params.has('subCluster')) {
        params.delete('subCluster');
        params.append('subCluster', cookies.get('subClusterUri'));
      } else {
        params.append('subCluster', cookies.get('subClusterUri'));
      }
      window.location = `${window.location.protocol}//${window.location.host}/httpfs.html?${params}`;
    }

    /**
     * @param {string} key
     * @param {string} text
     * @returns {import('office-ui-fabric-react').IContextualMenuItem}
     */
    function getItem(key) {
      const params = new URLSearchParams(window.location.search);
      return {
        key,
        text: key,
        canCheck: true,
        checked: (cookies.get('subClusterUri') == key && params.get('subCluster')== key),
        onClick: onClick,
      };
    }

    return {
      key: 'virtualCluster',
      name: 'Cluster',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'CellPhone',
      },
      subMenuProps: {
        items: Object.values(subClustersList).map(getItem).concat([{
          key: 'divider',
          itemType: ContextualMenuItemType.Divider,
        },
        ]),
      },
      commandBarButtonAs: FilterButton,
    };
  }

 

  const topBarItems = [
    listSubClusters(),
  ];

  const {spacing} = getTheme();

  return (
    <React.Fragment>
      <CommandBar
        items={topBarItems}
        styles={{root: {backgroundColor: 'transparent', padding: 0}}}
      />
    </React.Fragment>
  );
}

export default TopBar;
