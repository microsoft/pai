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
import com.microsoft.frameworklauncher.utils.CommonExtensions;
import com.microsoft.frameworklauncher.utils.DefaultLogger;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.List;

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
  // To improve it, considers the Gpu topology structure, find a node which can minimize
  // the communication cost between Gpus;
  public synchronized SelectionResult SelectCandidateRequestNode(ResourceDescriptor request, String nodeLabel, String nodeGpuType) {
    LOGGER.logInfo(
        "SelectCandidateRequestNode: Request Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s]",
        request, nodeLabel, nodeGpuType);

    // ClusterConfiguration is ready when this method is called, i.e. it is not null here.
    ClusterConfiguration clusterConfiguration = am.getClusterConfiguration();
    Map<String, NodeConfiguration> nodes = clusterConfiguration.getNodes();

    SelectionResult selectionResut = null;

    long candidateSelectGpu = 0;
    Iterator<Map.Entry<String, Node>> iter = candidateRequestNodes.entrySet().iterator();
    while (iter.hasNext()) {
      Map.Entry<String, Node> entry = iter.next();
      LOGGER.logDebug(
          "SelectCandidateRequestNode: Try node: " + entry.getValue().toString());

      if (nodeLabel != null) {
        Set<String> nodeLabels = entry.getValue().getNodeLabels();
        if (nodeLabels != null && nodeLabels.size() > 0 && !nodeLabels.contains(nodeLabel)) {
          LOGGER.logDebug(
              "SelectCandidateRequestNode: Skip node %s, label does not match: request label: %s",
              entry.getValue().getHostName(), nodeLabel, CommonExtensions.toString(nodeLabels));
          continue;
        }
      }
      if (nodeGpuType != null) {
        if (nodes.size() > 0) {
          if (!nodes.containsKey(entry.getValue().getHostName())) {
            LOGGER.logWarning(
                "SelectCandidateRequestNode: Skip node %s, getGpuType not set",
                entry.getValue().getHostName());
            continue;
          }
          String gpuType = (nodes.get(entry.getValue().getHostName())).getGpuType();
          if (!nodeGpuType.equals(gpuType)) {
            LOGGER.logDebug(
                "SelectCandidateRequestNode: Skip node %s (gpuTypeLabel:%s), gpuType don't match: request gpuType: %s",
                entry.getValue().getHostName(), gpuType, nodeGpuType);
            continue;
          }
        }
      }

      if (request.getMemoryMB() <= entry.getValue().getAvailableMemory() &&
          request.getCpuNumber() <= entry.getValue().getAvailableCpu() &&
          request.getGpuNumber() <= entry.getValue().getAvailableNumGpus()) {
        if (request.getGpuNumber() > 0) {
          Long candidateGpu = selectCandidateGpu(entry.getValue(), request.getGpuNumber());
          if (Long.bitCount(candidateGpu) == request.getGpuNumber()) {
            selectionResut = new SelectionResult();
            selectionResut.setNodeName(entry.getValue().getHostName());
            selectionResut.setSelectedGpuMap(candidateGpu);
            break;
          }
        }
      }
    }

    if (selectionResut != null) {
      LOGGER.logInfo(
          "SelectCandidateRequestNode: select node: " + selectionResut.getNodeName());
          } else {
      // AM will request resource with any node.
      LOGGER.logInfo(
          "SelectCandidateRequestNode: No enough resource");
    }
    return selectionResut;
  }

  public synchronized long selectCandidateGpu(Node candidateNode, int requestGpuCount) {
    long candidateSelectGpu = 0;
    long availableGpu = candidateNode.getNodeGpuStatus();

    // Sequentially select Gpus.
    for (int i = 0; i < requestGpuCount; i++) {
      candidateSelectGpu+= (availableGpu - (availableGpu & (availableGpu - 1)));
      availableGpu &= (availableGpu - 1);
    }
    return candidateSelectGpu;
  }

  public synchronized void removeCandidateRequestNode(Node candidateRequestNode) {
    if (candidateRequestNodes.containsKey(candidateRequestNode.getHostName())) {
      LOGGER.logInfo("removeCandidateRequestNode: %s", candidateRequestNode.getHostName());

      candidateRequestNodes.remove(candidateRequestNode.getHostName());
    }
  }

  public synchronized void allocateRequestingResource(ResourceDescriptor resource, List<String> nodeList) {

    for (String nodeName : nodeList) {
      if (!candidateRequestNodes.containsKey(nodeName)) {
        LOGGER.logWarning(
            "ReleaseLocalAllocatingResource: node is not exist: " + nodeName);
        continue;
      }
      candidateRequestNodes.get(nodeName).addRequestResource(resource);
  }
    return;
  }

  public synchronized void releaseRequestingResource(ResourceDescriptor resource, List<String> nodeList) {
    for (String nodeName : nodeList) {
      if (!candidateRequestNodes.containsKey(nodeName)) {
        LOGGER.logWarning(
            "ReleaseLocalAllocatingResource: node is not exist: " + nodeName);
        continue;
      }
      candidateRequestNodes.get(nodeName).removeRequestingResource(resource);
      return;
    }
  }
}
