/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import {
  initializeIcons,
  Fabric,
  Stack,
  getTheme,
} from 'office-ui-fabric-react';

import { initTheme } from '../../components/theme';
import { TopBar } from './top-bar';
import { FilterBar } from './filter-bar';
import { CategorySideBar } from './category-side-bar';
import { ItemList } from './item-list';
import { MarketItem } from './market-item';

initTheme();
initializeIcons();

const MarketList = () => {
  const itemList = [
    new MarketItem(
      'Minist Example',
      'debuggy',
      ['python', 'tensorflow'],
      null,
      'This is an example of tensorflow',
      null,
      true,
    ),
    new MarketItem(
      'Pytorch Cifar10',
      'qinsu',
      ['python', 'pytorch', 'cifar10', 'benchmark'],
      null,
      'This is a benchmark of pytorch cifar10 model',
      null,
      false,
    ),
  ];

  return (
    <Fabric style={{ height: '100%', margin: '0 auto', maxWidth: 1000 }}>
      <Stack padding='l1' gap='s'>
        <TopBar />
        <Stack horizontal gap='l2'>
          <CategorySideBar />
          <Stack.Item grow>
            <Stack gap='s' styles={{ root: [{ minWidth: 0 }] }}>
              <FilterBar />
              <ItemList items={itemList} />
            </Stack>
          </Stack.Item>
        </Stack>
      </Stack>
    </Fabric>
  );
};

const contentWrapper = document.getElementById('content-wrapper');

document.getElementById('sidebar-menu--marketplace').classList.add('active');
ReactDOM.render(<MarketList />, contentWrapper);
