// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import c from 'classnames';
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import cookies from 'js-cookie';
import PropTypes from 'prop-types';
import { FontClassNames, FontWeights, getTheme } from '@uifabric/styling';
import { DefaultButton } from 'office-ui-fabric-react';
import { isEmpty, cloneDeep } from 'lodash';

import Card from '../../components/card';
import { SpinnerLoading } from '../../components/loading';
import config from '../../config/webportal.config';
import {
  getUserRequest,
  getAllVcsRequest,
  getTokenRequest,
  createApplicationTokenRequest,
  revokeTokenRequest,
  updateUserPasswordRequest,
  updateUserEmailRequest,
  listStorageDetailRequest,
  getGroupsRequest,
  updateBoundedClustersRequest,
  updateUserRequest,
} from './conn';

import t from '../../components/tachyons.scss';
import { VirtualClusterDetailsList } from '../../home/home/virtual-cluster-statistics';
import TokenList from './user-profile/token-list';
import SSHlist from './user-profile/ssh-list';
import UserProfileHeader from './user-profile/header';
import StorageList from './user-profile/storage-list';
import BoundedClusterDialog from './user-profile/bounded-cluster-dialog';
import SSHListDialog from './user-profile/ssh-list-dialog';
import BoundedClusterList from './user-profile/bounded-cluster-list';

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

const enableJobTransfer = config.enableJobTransfer;

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [storageDetails, setStorageDetails] = useState(null);
  const [groups, setGroups] = useState(null);
  const [showBoundedClusterDialog, setShowBoundedClusterDialog] = useState(
    false,
  );
  const [showAddSSHpublicKeysDialog, setShowAddSSHpublicKeysDialog] = useState(
    false,
  );
  const [processing, setProcessing] = useState(false);
  const [sshProcessing, setSSHProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userPromise = getUserRequest(cookies.get('user'));
      const vcPromise = getAllVcsRequest();
      const tokenPromise = getTokenRequest();
      const storageDetailPromise = listStorageDetailRequest();
      const groupsPromise = getGroupsRequest();
      await Promise.all([
        userPromise,
        vcPromise,
        tokenPromise,
        storageDetailPromise,
        groupsPromise,
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
      const storageDetails = await storageDetailPromise;
      setStorageDetails(storageDetails);
      setLoading(false);
      // group
      const groups = await groupsPromise;
      setGroups(groups);
    };
    fetchData();
  }, []);

  const onEditProfile = useCallback(async ({ email }) => {
    await updateUserEmailRequest(userInfo.username, email);
    const newUserInfo = await getUserRequest(cookies.get('user'));
    setUserInfo(newUserInfo);
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

  // click `add public ssh keys button` -> open dialog
  const onAddPublicKeys = useCallback(async sshPublicKeys => {
    setSSHProcessing(true);
    let updatedSSHPublickeys = [];
    if (userInfo.extension.sshKeys) {
      updatedSSHPublickeys = cloneDeep(userInfo.extension.sshKeys);
    }
    updatedSSHPublickeys.push({
      title: sshPublicKeys.title,
      value: sshPublicKeys.value,
      time: sshPublicKeys.time,
    });
    await updateUserRequest(userInfo.username, updatedSSHPublickeys);
    const updatedUserInfo = await getUserRequest(userInfo.username);
    setUserInfo(updatedUserInfo);
    setSSHProcessing(false);
  });

  const onDeleteSSHkeys = useCallback(async sshPublicKeys => {
    let updatedSSHPublickeys = [];
    if (userInfo.extension.sshKeys) {
      updatedSSHPublickeys = cloneDeep(userInfo.extension.sshKeys);
    }
    updatedSSHPublickeys = updatedSSHPublickeys.filter(
      item => item.title !== sshPublicKeys.title,
    );
    await updateUserRequest(userInfo.username, updatedSSHPublickeys);
    const updatedUserInfo = await getUserRequest(userInfo.username);
    setUserInfo(updatedUserInfo);
  });

  const onRevokeToken = useCallback(async token => {
    await revokeTokenRequest(token);
    await getTokenRequest().then(res => setTokens(res.tokens));
  });

  const onAddBoundedCluster = async clusterConfig => {
    let updatedBoundedClusters = {};
    if (userInfo.extension.boundedClusters) {
      updatedBoundedClusters = cloneDeep(userInfo.extension.boundedClusters);
    }
    updatedBoundedClusters[clusterConfig.alias] = {
      uri: clusterConfig.uri,
      username: clusterConfig.username,
      token: clusterConfig.token,
    };
    await updateBoundedClustersRequest(
      userInfo.username,
      updatedBoundedClusters,
    );
    const updatedUserInfo = await getUserRequest(userInfo.username);
    setUserInfo(updatedUserInfo);
  };

  const onDeleteBoundedCluster = async clusterAlias => {
    let updatedBoundedClusters = {};
    if (userInfo.extension.boundedClusters) {
      updatedBoundedClusters = cloneDeep(userInfo.extension.boundedClusters);
    }
    if (!(clusterAlias in updatedBoundedClusters)) {
      throw new Error(
        `Cannot find cluster ${clusterAlias} in your bounded clusters!`,
      );
    }
    delete updatedBoundedClusters[clusterAlias];
    await updateBoundedClustersRequest(
      userInfo.username,
      updatedBoundedClusters,
    );
    const updatedUserInfo = await getUserRequest(userInfo.username);
    setUserInfo(updatedUserInfo);
  };

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
            title='SSH Public Keys'
            headerButton={
              <DefaultButton
                onClick={() => setShowAddSSHpublicKeysDialog(true)}
                disabled={sshProcessing}
              >
                Add SSH Public Keys
              </DefaultButton>
            }
          >
            <SSHlist
              sshKeys={userInfo.extension.sshKeys}
              onDeleteSSHkeys={onDeleteSSHkeys}
            />
            {/* dialog for add public ssh keys */}
            {showAddSSHpublicKeysDialog && (
              <SSHListDialog
                sshKeys={userInfo.extension.sshKeys}
                onDismiss={() => setShowAddSSHpublicKeysDialog(false)}
                onAddPublickeys={onAddPublicKeys}
              />
            )}
          </UserProfileCard>
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
            <StorageList storageDetails={storageDetails} />
          </UserProfileCard>
          <UserProfileCard title='Virtual Clusters'>
            <VirtualClusterDetailsList
              virtualClusters={virtualClusters}
              groups={groups}
            />
          </UserProfileCard>
          {enableJobTransfer === 'true' && (
            <UserProfileCard
              title='Bounded Clusters'
              headerButton={
                <DefaultButton
                  onClick={() => setShowBoundedClusterDialog(true)}
                >
                  Add a bounded cluster
                </DefaultButton>
              }
            >
              {showBoundedClusterDialog && (
                <BoundedClusterDialog
                  onDismiss={() => setShowBoundedClusterDialog(false)}
                  onAddBoundedCluster={onAddBoundedCluster}
                />
              )}
              {!isEmpty(userInfo.extension.boundedClusters) && (
                <BoundedClusterList
                  boundedClusters={userInfo.extension.boundedClusters}
                  onDelete={onDeleteBoundedCluster}
                />
              )}
              {isEmpty(userInfo.extension.boundedClusters) && (
                <div
                  className={c(t.mt5, FontClassNames.large)}
                  style={{ fontWeight: FontWeights.regular }}
                >
                  There is no added bounded cluster.
                </div>
              )}
            </UserProfileCard>
          )}
        </div>
      </div>
    );
  }
};

ReactDOM.render(<UserProfile />, document.getElementById('content-wrapper'));
