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

import org.apache.hadoop.yarn.api.records.NodeId;
import org.apache.hadoop.yarn.api.records.NodeReport;
import org.apache.hadoop.yarn.api.records.NodeState;
import org.apache.hadoop.yarn.api.records.Resource;
import org.apache.hadoop.yarn.util.Records;

import java.util.*;

public class MockResourceManager {
  private List<NodeReport> nodeReportList = new Vector<>();
  private static MockResourceManager instance;

  private MockResourceManager(int nodeNums, Resource resource) {
    initNodeIds(nodeNums, 10, resource);
  }

  public static synchronized MockResourceManager newInstance(int nodeNums, Resource resource) {
    if (instance == null) {
      instance = new MockResourceManager(nodeNums, resource);
    }
    return instance;
  }

  private void initNodeIds(int nodeNums, int containerNums, Resource resource) {
    Random portRandom = new Random();
    Random ipRandom = new Random();
    for (int i = 0; i < nodeNums; i++) {
      NodeReport nodeReport = Records.newRecord(NodeReport.class);
      nodeReport.setNumContainers(containerNums);
      nodeReport.setNodeLabels(new HashSet<>());
      nodeReport.setNodeState(NodeState.RUNNING);
      nodeReport.setCapability(resource);
      nodeReport.setUsed(Resource.newInstance(0, 0));

      int port = 1024 + portRandom.nextInt(65535 - 1024 + 1);
      StringBuilder hostStr = new StringBuilder();
      for (int j = 0; j < 4; j++) {
        hostStr.append(".").append(ipRandom.nextInt(256));
      }
      NodeId nodeId = NodeId.newInstance(hostStr.substring(1), port);
      nodeReport.setNodeId(nodeId);
      nodeReport.setHttpAddress(nodeId.getHost());

      nodeReportList.add(nodeReport);
    }
  }

  public List<NodeReport> getNodeReportList() {
    Collections.shuffle(nodeReportList);
    return nodeReportList;
  }
}
