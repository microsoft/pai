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
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import {
  Fabric,
  FontClassNames,
  initializeIcons,
} from 'office-ui-fabric-react';
import t from '../components/tachyons.scss';
import Top from './components/top';
import Summary from './components/summary';
import Detail from './components/detail';
import Context from './Context';
import { SpinnerLoading } from '../components/loading';
import { MarketItem } from '../models/market-item';

initializeIcons();

const MarketDetail = props => {
  const { api, history } = props;

  const [loading, setLoading] = useState(true);
  const [marketItem, setMarketItem] = useState(null);
  // load marketItem, taskRoles, jobConfig, jobDescription
  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    const nextState = {
      loading: false,
      reloading: false,
      marketItem: null,
      error: null,
    };
    const loadMarketItem = async () => {
      try {
        nextState.marketItem = await fetchMarketItem();
      } catch (err) {
        alert(err.message);
        window.location.href = `market-list.html`;
      }
    };
    await loadMarketItem();
    // update states
    setMarketItem(nextState.marketItem);
    setLoading(nextState.loading);
  }

  const context = {
    marketItem,
    api,
    history,
  };

  return (
    <Context.Provider value={context}>
      {loading && <SpinnerLoading />}
      {loading === false && (
        <Fabric style={{ height: '100%', margin: '0 auto', maxWidth: 1050 }}>
          <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
            <Top />
            <Summary />
            <Detail />
          </div>
        </Fabric>
      )}
    </Context.Provider>
  );

  async function fetchMarketItem() {
    //const params = new URLSearchParams(window.location.search);
    //const url = `${api}/api/v2/marketplace/items/${params.get('itemId')}`;
    const itemId = window.localStorage.getItem('itemId');
    const url = `${api}/api/v2/marketplace/items/${itemId}`;
    const res = await fetch(url);
    const json = await res.json();
    if (res.ok) {
      const marketItem = new MarketItem(
        json.id,
        json.name,
        json.author,
        json.createAt,
        json.updateAt,
        json.category,
        json.tags,
        json.introduction,
        json.description,
        json.jobConfig,
        json.submits,
        json.starNumber,
      );
      return marketItem;
    } else {
      throw new Error(json.message);
    }
  }
};

export default MarketDetail;
