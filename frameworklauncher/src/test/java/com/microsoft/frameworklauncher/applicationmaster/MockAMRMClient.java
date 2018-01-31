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

import org.apache.hadoop.yarn.api.protocolrecords.RegisterApplicationMasterResponse;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;
import org.apache.hadoop.yarn.client.api.async.AMRMClientAsync;
import org.apache.hadoop.yarn.exceptions.YarnException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class MockAMRMClient<T extends ContainerRequest> extends AMRMClientAsync<T> {
  private final MockResourceManager mockResourceManager;
  private final int allocateContainerNum = 6;

  private final ApplicationAttemptId attemptId;
  private AtomicInteger containerId = new AtomicInteger(0);

  public MockAMRMClient(ApplicationAttemptId attemptId, MockResourceManager mockResourceManager,
      int intervalMs, CallbackHandler callbackHandler) {
    super(null, intervalMs, callbackHandler);
    this.mockResourceManager = mockResourceManager;
    this.attemptId = attemptId;
  }

  @Override
  public List<? extends Collection<T>> getMatchingRequests(Priority priority, String resourceName, Resource capability) {
    return null;
  }

  @Override
  public RegisterApplicationMasterResponse registerApplicationMaster(String appHostName, int appHostPort, String appTrackingUrl) throws YarnException, IOException {
    return null;
  }

  @Override
  public void unregisterApplicationMaster(FinalApplicationStatus appStatus, String appMessage, String appTrackingUrl) throws YarnException, IOException {

  }

  @Override
  public void addContainerRequest(T req) {
    List<Container> allocateList =
        req.getRelaxLocality() ?
            addRelaxLocalityContainerRequest(req) :
            addNotRelaxLocalityContainerRequest(req);

    if (allocateList.size() != 0) {
      new AllocateContainerThread(allocateList).start();
    }
  }

  private List<Container> addNotRelaxLocalityContainerRequest(T req) {
    List<Container> allocateList = new ArrayList<>();

    List<String> nodeList = req.getNodes();
    List<NodeReport> nodeReportList = mockResourceManager.getNodeReportList();

    for (NodeReport nodeReport : nodeReportList) {
      NodeId nodeId = nodeReport.getNodeId();
      String host = nodeId.getHost();
      if (nodeList.contains(host)) {
        List<Container> containers = allocateContainersOnSameNode(
            1, nodeId, req.getCapability(), req.getPriority());
        allocateList.addAll(containers);
      }
    }
    return allocateList;
  }

  private List<Container> addRelaxLocalityContainerRequest(T req) {
    int satisfyNodeNum = 0, notSatisfyNodeNum = 0;
    List<Container> allocateList = new ArrayList<>();

    List<String> nodeList = req.getNodes();
    List<NodeReport> nodeReportList = mockResourceManager.getNodeReportList();

    for (NodeReport nodeReport : nodeReportList) {
      NodeId nodeId = nodeReport.getNodeId();
      String host = nodeId.getHost();

      if (nodeList.contains(host) && satisfyNodeNum < (allocateContainerNum >> 1)) {
        if (satisfyNodeNum == 0) {
          List<Container> containers = allocateContainersOnSameNode(
              2, nodeId, req.getCapability(), req.getPriority());
          allocateList.addAll(containers);
          satisfyNodeNum += 2;
        } else {
          List<Container> containers = allocateContainersOnSameNode(
              1, nodeId, req.getCapability(), req.getPriority());
          allocateList.addAll(containers);
          satisfyNodeNum++;
        }
      } else if (!nodeList.contains(host) && notSatisfyNodeNum < (allocateContainerNum >> 1)) {
        if (notSatisfyNodeNum == 0) {
          List<Container> containers = allocateContainersOnSameNode(
              2, nodeId, req.getCapability(), req.getPriority());
          allocateList.addAll(containers);
          notSatisfyNodeNum += 2;
        } else {
          List<Container> containers = allocateContainersOnSameNode(
              1, nodeId, req.getCapability(), req.getPriority());
          allocateList.addAll(containers);
          notSatisfyNodeNum++;
        }
      }
    }

    return allocateList;
  }

  private List<Container> allocateContainersOnSameNode(
      int containerNum, NodeId nodeId, Resource capability, Priority priority) {
    List<Container> containerList = new ArrayList<>();

    for (int i = 0; i < containerNum; i++) {
      ContainerId id =
          ContainerId.newContainerId(attemptId, containerId.addAndGet(1));
      Container container =
          Container.newInstance(id, nodeId, nodeId.getHost(), capability, priority, null);
      containerList.add(container);
    }
    return containerList;
  }

  @Override
  public void removeContainerRequest(T req) {

  }

  @Override
  public void releaseAssignedContainer(ContainerId containerId) {

  }

  @Override
  public Resource getAvailableResources() {
    return null;
  }

  @Override
  public int getClusterNodeCount() {
    return 0;
  }

  @Override
  public void updateBlacklist(List blacklistAdditions, List blacklistRemovals) {

  }

  private class AllocateContainerThread extends Thread {
    List<Container> list;

    public AllocateContainerThread(List<Container> list) {
      this.list = list;
    }

    @Override
    public void run() {
      handler.onContainersAllocated(list);
    }
  }
}
