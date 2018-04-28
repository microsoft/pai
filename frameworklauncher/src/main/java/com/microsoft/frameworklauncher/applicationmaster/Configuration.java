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

package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import com.microsoft.frameworklauncher.common.model.LauncherStatus;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.model.UserDescriptor;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.protocolrecords.RegisterApplicationMasterResponse;
import org.apache.hadoop.yarn.api.records.ApplicationAttemptId;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.apache.hadoop.yarn.conf.YarnConfiguration;
import org.apache.hadoop.yarn.util.ConverterUtils;

// Const parameters for the current AM instead of state variable
public class Configuration {
  private YarnConfiguration yarnConfig;
  private String frameworkName;
  private Integer frameworkVersion;
  private String zkConnectString;
  private String zkRootDir;
  private Integer amVersion;
  private Integer amRmHeartbeatIntervalSec;
  private String amHostName;
  private Integer amRpcPort;
  private String amTrackingUrl;
  private String amUser;
  private String amLocalDirs;
  private String amLogDirs;
  private String amContainerId;
  private String attemptId;
  private String applicationId;
  private LauncherConfiguration launcherConfig;
  private UserDescriptor loggedInUser;

  // Below properties defined for RM when AM Registered, it may be changed after RM configuration changed.
  private ResourceDescriptor maxResource;
  private String amQueue;
  private String amQueueDefaultNodeLabel;

  // For a normal container, initializeNoDependenceConfig must succeed
  public void initializeNoDependenceConfig() throws Exception {
    yarnConfig = new YarnConfiguration();
    frameworkName = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_FRAMEWORK_NAME);
    // frameworkVersion and amVersion for this AM is got from EnvironmentVariable,
    // so it will not change across attempts.
    // This can avoid multiple AM of one Framework running at the same time eventually,
    // by comparing these versions with the corresponding ones on the ZK.
    frameworkVersion = Integer.parseInt(CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_FRAMEWORK_VERSION));
    zkConnectString = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_ZK_CONNECT_STRING);
    zkRootDir = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_ZK_ROOT_DIR);
    amVersion = Integer.parseInt(CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_AM_VERSION));
    amRmHeartbeatIntervalSec = Integer.parseInt(CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC));
    amHostName = GlobalConstants.LOCAL_HOST_NAME;
    amRpcPort = -1;
    // Set a NotEmpty amTrackingUrl will override default (Proxied)TrackingUrl and OriginalTrackingUrl
    // which point to RMWebAPP.
    amTrackingUrl = "";
    amUser = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_USER);
    amLocalDirs = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_LOCAL_DIRS);
    amLogDirs = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_LOG_DIRS);
    amContainerId = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_CONTAINER_ID);
  }

  public void initializeDependOnZKStoreConfig(ZookeeperStore zkStore) throws Exception {
    // ConverterUtils depends on the JVM inited by ZooKeeperClient
    ApplicationAttemptId attemptId = ConverterUtils.toContainerId(getAmContainerId()).getApplicationAttemptId();
    this.attemptId = attemptId.toString();
    applicationId = attemptId.getApplicationId().toString();

    LauncherStatus launcherStatus = zkStore.getLauncherStatus();
    launcherConfig = launcherStatus.getLauncherConfiguration();
    loggedInUser = launcherStatus.getLoggedInUser();
  }

  public void initializeDependOnRMResponseConfig(RegisterApplicationMasterResponse rmResp) throws Exception {
    amQueue = rmResp.getQueue();
    maxResource = ResourceDescriptor.fromResource(rmResp.getMaximumResourceCapability());
  }

  public void initializeDependOnYarnClientConfig(YarnClient yarnClient) throws Exception {
    amQueueDefaultNodeLabel = yarnClient.getQueueInfo(getAmQueue()).getDefaultNodeLabelExpression();
  }

  protected YarnConfiguration getYarnConfig() {
    return yarnConfig;
  }

  protected String getFrameworkName() {
    return frameworkName;
  }

  protected Integer getFrameworkVersion() {
    return frameworkVersion;
  }

  protected String getZkConnectString() {
    return zkConnectString;
  }

  protected String getZkRootDir() {
    return zkRootDir;
  }

  protected Integer getAmVersion() {
    return amVersion;
  }

  protected Integer getAmRmHeartbeatIntervalSec() {
    return amRmHeartbeatIntervalSec;
  }

  protected String getAmHostName() {
    return amHostName;
  }

  protected Integer getAmRpcPort() {
    return amRpcPort;
  }

  protected String getAmTrackingUrl() {
    return amTrackingUrl;
  }

  protected String getAmUser() {
    return amUser;
  }

  protected String getAmLocalDirs() {
    return amLocalDirs;
  }

  protected String getAmLogDirs() {
    return amLogDirs;
  }

  protected String getAmContainerId() {
    return amContainerId;
  }

  protected String getAttemptId() {
    return attemptId;
  }

  protected String getApplicationId() {
    return applicationId;
  }

  protected LauncherConfiguration getLauncherConfig() {
    return launcherConfig;
  }

  public UserDescriptor getLoggedInUser() {
    return loggedInUser;
  }

  protected ResourceDescriptor getMaxResource() {
    return maxResource;
  }

  protected String getAmQueue() {
    return amQueue;
  }

  protected String getAmQueueDefaultNodeLabel() {
    return amQueueDefaultNodeLabel;
  }
}
