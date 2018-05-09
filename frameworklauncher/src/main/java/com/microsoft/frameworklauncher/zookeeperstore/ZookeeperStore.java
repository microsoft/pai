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

package com.microsoft.frameworklauncher.zookeeperstore;

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import org.apache.zookeeper.KeeperException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ZookeeperStore {
  private static final DefaultLogger LOGGER = new DefaultLogger(ZookeeperStore.class);

  protected final ZooKeeperClient zkClient;
  protected final ZookeeperStoreStructure zkStruct;

  public ZookeeperStore(String connectString, String launcherRootPath) throws Exception {
    LOGGER.logInfo(
        "Initializing ZookeeperStore: [ConnectString] = [%s], [LauncherRootPath] = [%s]",
        connectString, launcherRootPath);

    zkClient = new ZooKeeperClient(connectString);
    zkStruct = new ZookeeperStoreStructure(launcherRootPath);

    setupZKStructure();
  }

  // ONLY for testing
  protected ZookeeperStore(ZooKeeperClient zkClient, ZookeeperStoreStructure zkStruct) {
    this.zkClient = zkClient;
    this.zkStruct = zkStruct;
  }

  public void stop() {
    zkClient.stop();
  }

  // Setup Basic ZookeeperStoreStructure
  private void setupZKStructure() throws Exception {
    if (!zkClient.exists(zkStruct.getLauncherRootPath())) {
      zkClient.createPath(zkStruct.getLauncherRootPath());
    }
  }

  // Requests
  public LauncherRequest getLauncherRequest() throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getLauncherRequestPath(), LauncherRequest.class);
  }

  public void setLauncherRequest(LauncherRequest launcherRequest) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getLauncherRequestPath(), launcherRequest);
  }

  public FrameworkRequest getFrameworkRequest(String frameworkName) throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getFrameworkRequestPath(frameworkName), FrameworkRequest.class);
  }

  public void setFrameworkRequest(String frameworkName, FrameworkRequest frameworkRequest) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getFrameworkRequestPath(frameworkName), frameworkRequest);

    // Also prepare the dummy request node for its future child nodes
    zkClient.createPath(
        zkStruct.getMigrateTaskRequestsPath(frameworkName));
  }

  public void deleteFrameworkRequest(String frameworkName) throws Exception {
    deleteFrameworkRequest(frameworkName, false);
  }

  public void deleteFrameworkRequest(String frameworkName, Boolean childrenOnly) throws Exception {
    zkClient.deleteRecursively(
        zkStruct.getFrameworkRequestPath(frameworkName), childrenOnly);
  }

  public OverrideApplicationProgressRequest getOverrideApplicationProgressRequest(String frameworkName) throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getOverrideApplicationProgressRequestPath(frameworkName), OverrideApplicationProgressRequest.class);
  }

  public void setOverrideApplicationProgressRequest(String frameworkName, OverrideApplicationProgressRequest overrideApplicationProgressRequest) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getOverrideApplicationProgressRequestPath(frameworkName), overrideApplicationProgressRequest);
  }

  public MigrateTaskRequest getMigrateTaskRequest(String frameworkName, String containerId) throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getMigrateTaskRequestPath(frameworkName, containerId), MigrateTaskRequest.class);
  }

  public void setMigrateTaskRequest(String frameworkName, String containerId, MigrateTaskRequest migrateTaskRequest) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getMigrateTaskRequestPath(frameworkName, containerId), migrateTaskRequest);
  }

  public void deleteMigrateTaskRequest(String frameworkName, String containerId) throws Exception {
    zkClient.deleteRecursively(
        zkStruct.getMigrateTaskRequestPath(frameworkName, containerId));
  }

  // Statuses
  public LauncherStatus getLauncherStatus() throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getLauncherStatusPath(), LauncherStatus.class);
  }

  public void setLauncherStatus(LauncherStatus launcherStatus) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getLauncherStatusPath(), launcherStatus);
  }

  public FrameworkStatus getFrameworkStatus(String frameworkName) throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getFrameworkStatusPath(frameworkName), FrameworkStatus.class);
  }

  public void setFrameworkStatus(String frameworkName, FrameworkStatus frameworkStatus) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getFrameworkStatusPath(frameworkName), frameworkStatus);
  }

  public void deleteFrameworkStatus(String frameworkName) throws Exception {
    deleteFrameworkStatus(frameworkName, false);
  }

  public void deleteFrameworkStatus(String frameworkName, Boolean childrenOnly) throws Exception {
    zkClient.deleteRecursively(
        zkStruct.getFrameworkStatusPath(frameworkName), childrenOnly);
  }

  public TaskRoleStatus getTaskRoleStatus(String frameworkName, String taskRoleName) throws Exception {
    return zkClient.getSmallObject(
        zkStruct.getTaskRoleStatusPath(frameworkName, taskRoleName), TaskRoleStatus.class);
  }

  public void setTaskRoleStatus(String frameworkName, String taskRoleName, TaskRoleStatus taskRoleStatus) throws Exception {
    zkClient.setSmallObject(
        zkStruct.getTaskRoleStatusPath(frameworkName, taskRoleName), taskRoleStatus);
  }

  public TaskStatuses getTaskStatuses(String frameworkName, String taskRoleName) throws Exception {
    return zkClient.getLargeObject(
        zkStruct.getTaskStatusesPath(frameworkName, taskRoleName), TaskStatuses.class);
  }

  public void setTaskStatuses(String frameworkName, String taskRoleName, TaskStatuses taskStatuses) throws Exception {
    zkClient.setLargeObject(
        zkStruct.getTaskStatusesPath(frameworkName, taskRoleName), taskStatuses);
  }


  // AggregatedRequests
  public AggregatedFrameworkRequest getAggregatedFrameworkRequest(String frameworkName) throws Exception {
    AggregatedFrameworkRequest aggregatedFrameworkRequest = new AggregatedFrameworkRequest();

    aggregatedFrameworkRequest.setFrameworkRequest(getFrameworkRequest(frameworkName));

    try {
      aggregatedFrameworkRequest.setOverrideApplicationProgressRequest(getOverrideApplicationProgressRequest(frameworkName));
    } catch (KeeperException.NoNodeException e) {
      aggregatedFrameworkRequest.setOverrideApplicationProgressRequest(null);
    }

    try {
      aggregatedFrameworkRequest.setMigrateTaskRequests(new HashMap<>());
      for (String containerId : zkClient.getChildren(zkStruct.getMigrateTaskRequestsPath(frameworkName))) {
        try {
          aggregatedFrameworkRequest.getMigrateTaskRequests().put(containerId, getMigrateTaskRequest(frameworkName, containerId));
        } catch (KeeperException.NoNodeException ignored) {
        }
      }
    } catch (KeeperException.NoNodeException e) {
      aggregatedFrameworkRequest.setMigrateTaskRequests(null);
    }

    return aggregatedFrameworkRequest;
  }

  public AggregatedLauncherRequest getAggregatedLauncherRequest() throws Exception {
    AggregatedLauncherRequest aggregatedLauncherRequest = new AggregatedLauncherRequest();

    aggregatedLauncherRequest.setLauncherRequest(getLauncherRequest());
    aggregatedLauncherRequest.setAggregatedFrameworkRequests(new HashMap<>());
    for (String frameworkName : zkClient.getChildren(zkStruct.getLauncherRequestPath())) {
      try {
        aggregatedLauncherRequest.getAggregatedFrameworkRequests().put(frameworkName, getAggregatedFrameworkRequest(frameworkName));
      } catch (KeeperException.NoNodeException ignored) {
      }
    }

    return aggregatedLauncherRequest;
  }

  // Specialization for performance
  public Map<String, FrameworkRequest> getAllFrameworkRequests() throws Exception {
    Map<String, FrameworkRequest> allFrameworkRequests = new HashMap<>();
    for (String frameworkName : zkClient.getChildren(zkStruct.getLauncherRequestPath())) {
      try {
        allFrameworkRequests.put(frameworkName, getFrameworkRequest(frameworkName));
      } catch (KeeperException.NoNodeException ignored) {
      }
    }
    return allFrameworkRequests;
  }

  // AggregatedStatuses
  public AggregatedTaskRoleStatus getAggregatedTaskRoleStatus(String frameworkName, String taskRoleName) throws Exception {
    AggregatedTaskRoleStatus aggregatedTaskRoleStatus = new AggregatedTaskRoleStatus();
    aggregatedTaskRoleStatus.setTaskRoleStatus(getTaskRoleStatus(frameworkName, taskRoleName));
    aggregatedTaskRoleStatus.setTaskStatuses(getTaskStatuses(frameworkName, taskRoleName));
    return aggregatedTaskRoleStatus;
  }

  public AggregatedFrameworkStatus getAggregatedFrameworkStatus(String frameworkName) throws Exception {
    AggregatedFrameworkStatus aggregatedFrameworkStatus = new AggregatedFrameworkStatus();
    aggregatedFrameworkStatus.setFrameworkStatus(getFrameworkStatus(frameworkName));

    aggregatedFrameworkStatus.setAggregatedTaskRoleStatuses(new HashMap<>());
    for (String taskRoleName : zkClient.getChildren(zkStruct.getFrameworkStatusPath(frameworkName))) {
      try {
        aggregatedFrameworkStatus.getAggregatedTaskRoleStatuses().put(taskRoleName, getAggregatedTaskRoleStatus(frameworkName, taskRoleName));
      } catch (KeeperException.NoNodeException ignored) {
      }
    }
    return aggregatedFrameworkStatus;
  }

  public AggregatedLauncherStatus getAggregatedLauncherStatus() throws Exception {
    return getAggregatedLauncherStatus(new HashSet<>());
  }

  public AggregatedLauncherStatus getAggregatedLauncherStatus(Set<String> excludedFrameworkNames) throws Exception {
    AggregatedLauncherStatus aggregatedLauncherStatus = new AggregatedLauncherStatus();
    aggregatedLauncherStatus.setLauncherStatus(getLauncherStatus());
    aggregatedLauncherStatus.setAggregatedFrameworkStatuses(new HashMap<>());
    for (String frameworkName : zkClient.getChildren(zkStruct.getLauncherStatusPath())) {
      if (excludedFrameworkNames.contains(frameworkName)) {
        continue;
      }

      try {
        aggregatedLauncherStatus.getAggregatedFrameworkStatuses().put(frameworkName, getAggregatedFrameworkStatus(frameworkName));
      } catch (KeeperException.NoNodeException ignored) {
      } catch (KeeperException e) {
        throw e;
      } catch (Exception e) {
        LOGGER.logWarning(e,
            "[%s]: getAggregatedLauncherStatus: Got corrupted data",
            frameworkName);
        aggregatedLauncherStatus.getAggregatedFrameworkStatuses().put(frameworkName, null);
      }
    }
    return aggregatedLauncherStatus;
  }

  // Specialization for performance
  public Map<String, FrameworkStatus> getAllFrameworkStatuses() throws Exception {
    Map<String, FrameworkStatus> allFrameworkStatuses = new HashMap<>();
    for (String frameworkName : zkClient.getChildren(zkStruct.getLauncherStatusPath())) {
      try {
        allFrameworkStatuses.put(frameworkName, getFrameworkStatus(frameworkName));
      } catch (KeeperException.NoNodeException ignored) {
      } catch (KeeperException e) {
        throw e;
      } catch (Exception e) {
        LOGGER.logWarning(e,
            "[%s]: getAllFrameworkStatuses: Got corrupted data",
            frameworkName);
        allFrameworkStatuses.put(frameworkName, null);
      }
    }
    return allFrameworkStatuses;
  }
}
