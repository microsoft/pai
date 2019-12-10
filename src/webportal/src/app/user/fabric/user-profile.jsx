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
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { FontClassNames, FontWeights, getTheme } from '@uifabric/styling';
import { DefaultButton, initializeIcons } from 'office-ui-fabric-react';

import Card from '../../components/card';
import { SpinnerLoading } from '../../components/loading';
import {
  getUserRequest,
  getAllVcsRequest,
  getTokenRequest,
  createApplicationTokenRequest,
  revokeTokenRequest,
  updateUserPasswordRequest,
  updateUserEmailRequest,
  listStorageServerRequest,
  listStorageConfigRequest,
} from './conn';

import t from '../../components/tachyons.scss';
import { VirtualClusterDetailsList } from '../../home/home/virtual-cluster-statistics';
import TokenList from './user-profile/token-list';
import { initTheme } from '../../components/theme';
import UserProfileHeader from './user-profile/header';
import StorageList from './user-profile/storage-list';

initTheme();
initializeIcons();

const UserProfileCard = ({ title, children, headerButton }) => {
  const { spacing } = getTheme();
  return (
    <Card className={t.mt4} style={{ padding: `${spacing.l1} ${spacing.l2}` }}>
      <div className={c(t.flex, t.justifyBetween)}>
        <div
          className={FontClassNames.xLarge}
          style={{ fontWeight: FontWeights.regular }}
        >
          {title}
        </div>
        <div>{headerButton}</div>
      </div>
      <div className={t.mt3}>{children}</div>
    </Card>
  );
};

UserProfileCard.propTypes = {
  headerButton: PropTypes.node,
  title: PropTypes.string,
  children: PropTypes.node,
};

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [storageConfigs, setStorageConfigs] = useState(null);
  const [storageServers, setStorageServers] = useState(null);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userPromise = getUserRequest(cookies.get('user'));
      const vcPromise = getAllVcsRequest();
      const tokenPromise = getTokenRequest();
      const storageConfigPromise = listStorageConfigRequest();
      const storageServerPromise = listStorageServerRequest();
      await Promise.all([
        userPromise,
        vcPromise,
        tokenPromise,
        storageConfigPromise,
        storageServerPromise,
      ]).catch(err => {
        alert(err);
        throw err;
      });
      // user
      const userInfo = await userPromise;
      setUserInfo(userInfo);
      // vc
      const virtualClusters = await vcPromise;
      const userVcList = {};
      for (const name of userInfo.virtualCluster) {
        if (!virtualClusters[name]) {
          continue;
        }
        userVcList[name] = virtualClusters[name];
      }
      setVirtualClusters(userVcList);
      // token
      const tokens = (await tokenPromise).tokens;
      setTokens(tokens);
      // storage
      const storageConfigs = await storageConfigPromise;
      const storageServers = await storageServerPromise;
      setStorageConfigs(
        storageConfigs.filter(
          x =>
            userInfo.storageConfig && userInfo.storageConfig.includes(x.name),
        ),
      );
      setStorageServers(storageServers);
      setLoading(false);
    };
    fetchData();
  }, []);

  const onEditProfile = useCallback(async ({ email }) => {
    await updateUserEmailRequest(userInfo.username, email);
  });

  const onEditPassword = useCallback(async ({ oldPassword, newPassword }) => {
    await updateUserPasswordRequest(
      userInfo.username,
      newPassword,
      oldPassword,
    );
  });

  const onCreateApplicationToken = useCallback(async () => {
    setProcessing(true);
    await createApplicationTokenRequest();
    await getTokenRequest().then(res => {
      setTokens(res.tokens);
      setProcessing(false);
    });
  });

  const onRevokeToken = useCallback(async token => {
    await revokeTokenRequest(token);
    await getTokenRequest().then(res => setTokens(res.tokens));
  });

  const { spacing } = getTheme();

  if (loading) {
    return <SpinnerLoading />;
  } else {
    return (
      <div className={c(t.pv5, t.ph5)}>
        <div className={c(t.center)} style={{ maxWidth: 1200 }}>
          <Card style={{ padding: `${spacing.l1} ${spacing.l2}` }}>
            {/* summary */}
            <UserProfileHeader
              userInfo={userInfo}
              onEditProfile={onEditProfile}
              onEditPassword={onEditPassword}
            />
          </Card>
          <UserProfileCard
            title='Tokens'
            headerButton={
              <DefaultButton
                onClick={onCreateApplicationToken}
                disabled={processing}
              >
                Create application token
              </DefaultButton>
            }
          >
            <TokenList tokens={tokens} onRevoke={onRevokeToken} />
          </UserProfileCard>
          <UserProfileCard title='Storage'>
            <StorageList
              storageConfigs={storageConfigs}
              storageServers={storageServers}
            />
          </UserProfileCard>
          <UserProfileCard title='Virtual Clusters'>
            <VirtualClusterDetailsList virtualClusters={virtualClusters} />
          </UserProfileCard>
        </div>
      </div>
    );
  }
};

ReactDOM.render(<UserProfile />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--user-profile').classList.add('active');
