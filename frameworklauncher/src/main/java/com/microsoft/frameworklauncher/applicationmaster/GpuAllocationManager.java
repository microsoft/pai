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

import com.microsoft.frameworklauncher.common.model.ClusterConfiguration;
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.utils.DefaultLogger;
import com.microsoft.frameworklauncher.utils.YamlUtils;

import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;


public class GpuAllocationManager { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(GpuAllocationManager.class);

  private final ApplicationMaster am;

  // Candidate request Nodes for this application
  private final LinkedHashMap<String, Node> candidateRequestNodes = new LinkedHashMap<>();

  public GpuAllocationManager(ApplicationMaster am) {
    this.am = am;
  }

  public synchronized void addCandidateRequestNode(Node candidateRequestNode) {
    if (!candidateRequestNodes.containsKey(candidateRequestNode.getHostName())) {
      LOGGER.logInfo("addCandidateRequestNode: %s", candidateRequestNode.getHostName());
      candidateRequestNodes.put(candidateRequestNode.getHostName(), candidateRequestNode);
    } else {
      Node existNode = candidateRequestNodes.get(candidateRequestNode.getHostName());
      existNode.updateNode(candidateRequestNode);
      LOGGER.logInfo("updateCandidateRequestNode: %s ", existNode);
    }
  }

  // According to the request resource, find a candidate node.
  // To improve it, considers the GPU topology structure, find a node which can minimize
  // the communication cost between GPUs;
  public synchronized Node allocateCandidateRequestNode(ResourceDescriptor request, String nodeLabel, String nodeGpuType) {
    LOGGER.logInfo(
        "allocateCandidateRequestNode: Request Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s]",
        request, nodeLabel, nodeGpuType);

    // ClusterConfiguration is ready when this method is called, i.e. it is not null here.
    ClusterConfiguration clusterConfiguration = am.getClusterConfiguration();
    Map<String, NodeConfiguration> nodes = clusterConfiguration.getNodes();

    Iterator<Map.Entry<String, Node>> iter = candidateRequestNodes.entrySet().iterator();
    Node candidateNode = null;
    long candidateSelectGPU = 0;

    while (iter.hasNext()) {
      Map.Entry<String, Node> entry = iter.next();
      LOGGER.logInfo(
          "allocateCandidateRequestNode: Try node: " + entry.getValue().toString());

      if (nodeLabel != null) {
        Set<String> nodeLabels = entry.getValue().getNodeLabels();
        if (nodeLabels != null && nodeLabels.size() > 0 && !nodeLabels.contains(nodeLabel)) {
          LOGGER.logDebug(
              "allocateCandidateRequestNode: Skip node %s, label does not match:%s",
              entry.getValue().getHostName(), nodeLabel);
          continue;
        }
      }
      if (nodeGpuType != null && nodes.size() > 0) {
        if (!nodes.containsKey(entry.getValue().getHostName())) {
          LOGGER.logWarning(
              "allocateCandidateRequestNode: Skip node %s, getGpuType not set",
              entry.getValue().getHostName());
          continue;
        }
        String gpuType = (nodes.get(entry.getValue().getHostName())).getGpuType();
        if (!nodeGpuType.equals(gpuType)) {
          LOGGER.logDebug(
              "allocateCandidateRequestNode: Skip node %s (gpuTypeLabel:%s), labels don't match: request nodeLabel: %s",
              entry.getValue().getHostName(), gpuType, nodeGpuType);
          continue;
        }
      }
      if (request.getMemoryMB() <= entry.getValue().getAvailableMemory() &&
          request.getCpuNumber() <= entry.getValue().getAvailableCpu() &&
          request.getGpuNumber() <= entry.getValue().getAvailableNumGpus()) {
        if (request.getGpuNumber() > 0) {
          candidateNode = entry.getValue();
          candidateSelectGPU = selectCandidateGPU(candidateNode, request.getGpuNumber());
        }
        break;
      }
    }

    if (candidateNode != null) {
      candidateNode.allocateResource(request, candidateSelectGPU);
      LOGGER.logInfo(
          "allocateCandidateRequestNode: select node: " + candidateNode.toString());
    } else {
      // AM will request resource with any node.
      LOGGER.logInfo(
          "allocateCandidateRequestNode: No enough resource");
    }

    return candidateNode;
  }

  public synchronized long selectCandidateGPU(Node candidateNode, int requestGPUCount) {
    long candidateSelectGPU = 0;
    long availableGPU = candidateNode.getNodeGpuStatus();

    // Sequentially select GPUs.
    for (int i = 0; i < requestGPUCount; i++) {
      candidateSelectGPU += (availableGPU - (availableGPU & (availableGPU - 1)));
      availableGPU &= (availableGPU - 1);
    }
    return candidateSelectGPU;
  }

  public synchronized void removeCandidateRequestNode(Node candidateRequestNode) {
    if (candidateRequestNodes.containsKey(candidateRequestNode.getHostName())) {
      LOGGER.logInfo("removeCandidateRequestNode: %s", candidateRequestNode.getHostName());

      candidateRequestNodes.remove(candidateRequestNode.getHostName());
    }
  }

  public synchronized void releaseLocalAllocatingResource(ResourceDescriptor resource, String nodeName) {
    if (!candidateRequestNodes.containsKey(nodeName)) {
      LOGGER.logWarning(
          "ReleaseLocalAllocatingResource: node is not exist: " + nodeName);
      return;
    }
    candidateRequestNodes.get(nodeName).releaseLocalAllocatingResource(resource);
    return;
  }
}
