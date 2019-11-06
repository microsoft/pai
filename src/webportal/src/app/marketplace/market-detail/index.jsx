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
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { Fabric, Text, Stack, CommandButton, FontClassNames, initializeIcons } from 'office-ui-fabric-react';
import t from '../../components/tachyons.scss';
import Top from './top';
import Summary from './summary';
import Detail from './detail';
import {fetchMarketItem, fetchJobConfig_marketplace, fetchTaskRoles_marketplace} from './conn';
import Context from './Context';
import { SpinnerLoading } from '../../components/loading';

initializeIcons();

const MarketDetail = (props) => {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [jobInfo, setJobInfo] = useState(null);
  const [error, setError] = useState(null);
  const [jobConfig, setJobConfig] = useState(null);
  const [taskRoles, setTaskRoles] = useState(null);

  // load jobInfo, taskRoles, jobConfig, jobDescription
  useEffect(() => {
    /*
    async function reload_() {
      await reload();
    }*/
    const reload_ = async () => {
      await reload();
    };
    reload_();
  }, []);

  async function reload() {
    console.log('reloading...');
    setReloading(true);
    const nextState = {
      loading: false,
      reloading: false,
      jobInfo: null,
      error: null,
    };
    const loadJobInfo = async () => {
      try {
        nextState.jobInfo = await fetchMarketItem();
      }catch (err) {
        nextState.error = `fetch job status failed: ${err.message}`;
      }
    };
    /*
    const loadTaskRoles = async () => {
      try {
        nextState.taskRoles = await fetchTaskRoles_marketplace();
      }catch (err) {

      }
    };
    const loadJobConfig = async () => {
      try {
        nextState.jobConfig = await fetchJobConfig_marketplace();
      }catch (err) {

      }
    };
    */
    await Promise.all([
      loadJobInfo(),
      //loadTaskRoles(),
      //loadJobConfig(),
    ]);
    
    // update states
    setJobInfo(nextState.jobInfo);
    setReloading(nextState.reloading);
    setError(nextState.error);
    //setJobConfig(nextState.jobConfig);
    //setTaskRoles(nextState.taskRoles);
    setLoading(nextState.loading);

    //console.table(jobInfo);
  }

  return (
      <Context.Provider value={{jobInfo, taskRoles}}>
        {loading && (
          <SpinnerLoading />
        )}
        {loading === false && (
        <Fabric style={{ height: '100%', margin: '0 auto', maxWidth: 1050 }}>
          <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
            <Top />
            <Summary
              jobInfo={jobInfo}
              jobConfig={jobConfig}
            />
            <Detail />
          </div>
        </Fabric>
        )}
      </Context.Provider>
  );
};

const contentWrapper = document.getElementById('content-wrapper');
ReactDOM.render(<MarketDetail />, contentWrapper);
document.getElementById('sidebar-menu--marketplace').classList.add('active');
