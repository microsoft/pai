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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import c from 'classnames';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import cookies from 'js-cookie';

import Card from '../../components/card';
import { SpinnerLoading } from '../../components/loading';
import { getUserRequest, getAllVcsRequest, getTokenRequest } from './conn';

import t from '../../components/tachyons.scss';
import {
  ColorClassNames,
  FontClassNames,
  FontWeights,
  getTheme,
} from '@uifabric/styling';
import Pill from './user-profile/pill';
import { Button, PrimaryButton } from 'office-ui-fabric-react';
import { VirtualClusterDetailsList } from '../../home/home/virtual-cluster-statistics';

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [storages, setStorages] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const userPromise = getUserRequest(cookies.get('user'));
      const vcPromise = getAllVcsRequest();
      const tokenPromise = getTokenRequest();
      // TODO: storage
      await Promise.all([userPromise, vcPromise, tokenPromise]).catch(err => {
        alert(err);
        throw err;
      });
      const userInfo = await userPromise;
      const vcInfo = await vcPromise;
      const userVcList = {};
      for (const name of userInfo.virtualCluster) {
        if (!vcInfo[name]) {
          continue;
        }
        userVcList[name] = vcInfo[name];
      }
      const tokens = (await tokenPromise).tokens;
      // setUserInfo(userInfo);
      setUserInfo({
        username: 'core',
        admin: true,
        grouplist: ['admingroup', 'group2'],
        virtualCluster: ['default'],
        email: 'core@core.com',
      });
      setVirtualClusters(virtualClusters);
      setTokens(tokens);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <SpinnerLoading />;
  } else {
    const { spacing } = getTheme();
    return (
      <div>
        <Card
          className={c(t.mw9, t.center, t.mv5)}
          style={{ padding: `${spacing.l1} ${spacing.l2}` }}
        >
          <div className={c(t.flex, t.justifyBetween)}>
            {/* summary left */}
            <div>
              <div className={c(t.flex, t.itemsBaseline)}>
                <div
                  className={FontClassNames.xxLarge}
                  style={{ fontWeight: FontWeights.regular }}
                >
                  {userInfo.username}
                </div>
                {userInfo.admin && <Pill className={t.ml3}>Admin</Pill>}
              </div>
              <div className={t.mt4}>
                <div className={c(t.flex, t.itemsCenter)}>
                  <div
                    className={ColorClassNames.neutralSecondary}
                    style={{ width: 60 }}
                  >
                    Email:
                  </div>
                  <div className={c(t.ml2)}>{userInfo.email}</div>
                </div>
                <div className={c(t.mt3, t.flex, t.itemsCenter)}>
                  <div
                    className={ColorClassNames.neutralSecondary}
                    style={{ width: 60 }}
                  >
                    Groups:
                  </div>
                  <div className={t.ml2}>{userInfo.grouplist.join(', ')}</div>
                </div>
              </div>
            </div>
            {/* summary right */}
            <div className={c(t.flex, t.flexColumn, t.mt2)}>
              <div>
                <PrimaryButton
                  styles={{
                    root: {
                      width: 140,
                    },
                  }}
                >
                  Edit Profile
                </PrimaryButton>
              </div>
              <div className={t.mt3} style={{ width: 140 }}>
                <Button
                  styles={{
                    root: {
                      width: 140,
                    },
                  }}
                >
                  Edit Password
                </Button>
              </div>
            </div>
          </div>
          <hr className={ColorClassNames.neutralQuaternaryBorder} />
          <div>
            <div className={FontClassNames.large}>Virtual Clusters</div>
            <div>
              <VirtualClusterDetailsList
                virtualClusters={virtualClusters}
              />
              {userInfo.virtualCluster.map(name => (
                <div className={t.brPill} key={`group-${name}`}>
                  {name}
                </div>
              ))}
            </div>
          </div>
          <hr className={ColorClassNames.neutralQuaternaryBorder} />
          <div>
            <div className={FontClassNames.large}>Storage</div>
            <div>
              {userInfo.virtualCluster.map(name => (
                <div className={t.brPill} key={`group-${name}`}>
                  {name}
                </div>
              ))}
            </div>
          </div>
          <hr className={ColorClassNames.neutralQuaternaryBorder} />
          <div>
            <div className={FontClassNames.large}>Tokens</div>
            <div>
              {userInfo.virtualCluster.map(name => (
                <div className={t.brPill} key={`group-${name}`}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }
};

ReactDOM.render(<UserProfile />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--user-profile').classList.add('active');
