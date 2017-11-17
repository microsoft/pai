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

import org.apache.hadoop.io.Text;
import org.apache.hadoop.security.token.Token;
import org.apache.hadoop.yarn.api.protocolrecords.*;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.apache.hadoop.yarn.client.api.YarnClientApplication;
import org.apache.hadoop.yarn.exceptions.YarnException;
import org.apache.hadoop.yarn.security.AMRMTokenIdentifier;

import java.io.IOException;
import java.util.*;

public class MockYarnClient extends YarnClient {
  private MockResourceManager mockResourceManager;

  public MockYarnClient(MockResourceManager mockResourceManager) {
    super(null);
    this.mockResourceManager = mockResourceManager;
  }

  @Override
  public YarnClientApplication createApplication() throws YarnException, IOException {
    return null;
  }

  @Override
  public ApplicationId submitApplication(ApplicationSubmissionContext appContext) throws YarnException, IOException {
    return null;
  }

  @Override
  public void killApplication(ApplicationId applicationId) throws YarnException, IOException {

  }

  @Override
  public ApplicationReport getApplicationReport(ApplicationId appId) throws YarnException, IOException {
    return null;
  }

  @Override
  public Token<AMRMTokenIdentifier> getAMRMToken(ApplicationId appId) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ApplicationReport> getApplications() throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ApplicationReport> getApplications(Set<String> applicationTypes) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ApplicationReport> getApplications(EnumSet<YarnApplicationState> applicationStates) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ApplicationReport> getApplications(Set<String> applicationTypes, EnumSet<YarnApplicationState> applicationStates) throws YarnException, IOException {
    return null;
  }

  @Override
  public YarnClusterMetrics getYarnClusterMetrics() throws YarnException, IOException {
    return null;
  }

  @Override
  public List<NodeReport> getNodeReports(NodeState... states) throws YarnException, IOException {
    List<NodeReport> reports = new ArrayList<>();

    List<NodeReport> nodeReportList = mockResourceManager.getNodeReportList();
    for (NodeReport nodeReport : nodeReportList) {
      for (NodeState state : states) {
        if (nodeReport.getNodeState() == state)
          reports.add(nodeReport);
      }
    }

    return reports;
  }

  @Override
  public org.apache.hadoop.yarn.api.records.Token getRMDelegationToken(Text renewer) throws YarnException, IOException {
    return null;
  }

  @Override
  public QueueInfo getQueueInfo(String queueName) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<QueueInfo> getAllQueues() throws YarnException, IOException {
    return null;
  }

  @Override
  public List<QueueInfo> getRootQueueInfos() throws YarnException, IOException {
    return null;
  }

  @Override
  public List<QueueInfo> getChildQueueInfos(String parent) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<QueueUserACLInfo> getQueueAclsInfo() throws YarnException, IOException {
    return null;
  }

  @Override
  public ApplicationAttemptReport getApplicationAttemptReport(ApplicationAttemptId applicationAttemptId) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ApplicationAttemptReport> getApplicationAttempts(ApplicationId applicationId) throws YarnException, IOException {
    return null;
  }

  @Override
  public ContainerReport getContainerReport(ContainerId containerId) throws YarnException, IOException {
    return null;
  }

  @Override
  public List<ContainerReport> getContainers(ApplicationAttemptId applicationAttemptId) throws YarnException, IOException {
    return null;
  }

  @Override
  public void moveApplicationAcrossQueues(ApplicationId appId, String queue) throws YarnException, IOException {

  }

  @Override
  public ReservationSubmissionResponse submitReservation(ReservationSubmissionRequest request) throws YarnException, IOException {
    return null;
  }

  @Override
  public ReservationUpdateResponse updateReservation(ReservationUpdateRequest request) throws YarnException, IOException {
    return null;
  }

  @Override
  public ReservationDeleteResponse deleteReservation(ReservationDeleteRequest request) throws YarnException, IOException {
    return null;
  }

  @Override
  public Map<NodeId, Set<String>> getNodeToLabels() throws YarnException, IOException {
    return null;
  }

  @Override
  public Map<String, Set<NodeId>> getLabelsToNodes() throws YarnException, IOException {
    return null;
  }

  @Override
  public Map<String, Set<NodeId>> getLabelsToNodes(Set<String> labels) throws YarnException, IOException {
    return null;
  }

  @Override
  public Set<String> getClusterNodeLabels() throws YarnException, IOException {
    return null;
  }
}
