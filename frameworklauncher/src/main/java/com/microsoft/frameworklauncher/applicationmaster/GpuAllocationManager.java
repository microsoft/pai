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
import com.microsoft.frameworklauncher.utils.YamlUtils;
import org.apache.hadoop.yarn.client.api.AMRMClient;

import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.List;
import java.util.Arrays;


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
      LOGGER.logDebug("addCandidateRequestNode: %s", candidateRequestNode.getHostName());
      candidateRequestNodes.put(candidateRequestNode.getHostName(), candidateRequestNode);
    } else {
      Node existNode = candidateRequestNodes.get(candidateRequestNode.getHostName());
      existNode.updateNode(candidateRequestNode);
      LOGGER.logDebug("updateCandidateRequestNode: %s ", existNode);
    }
  }

  // According to the request resource, find a candidate node.
  // To improve it, considers the Gpu topology structure, find a node which can minimize
  // the communication cost between Gpus;
  public synchronized GpuAllocation selectCandidateRequestNode(ResourceDescriptor request, String nodeLabel, String nodeGpuType) {
    LOGGER.logDebug(
        "selectCandidateRequestNode: Request Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s]",
        request, nodeLabel, nodeGpuType);

    // ClusterConfiguration is ready when this method is called, i.e. it is not null here.
    ClusterConfiguration clusterConfiguration = am.getClusterConfiguration();
    Map<String, NodeConfiguration> nodes = clusterConfiguration.getNodes();

    Long requestGpu = request.getGpuAttribute();
    if (requestGpu > 0 && Long.bitCount(requestGpu) != request.getGpuNumber()) {
      LOGGER.logError(
          "selectCandidateRequestNode: request GPU number (%d) is not consistent with request GPU attribute(%s)", request.getGpuNumber(), Long.toBinaryString(requestGpu));
      return null;
    }
    GpuAllocation gpuAllocation = null;
    List gpuTypeList = null;
    if(nodeGpuType != null && !nodeGpuType.trim().isEmpty()) {
      gpuTypeList = Arrays.asList(nodeGpuType.split(","));
    }

    for (Map.Entry<String, Node> entry : candidateRequestNodes.entrySet()) {
      LOGGER.logDebug(
          "selectCandidateRequestNode: Try node: " + entry.getValue().toString());

      if (nodeLabel != null) {
        Set<String> nodeLabels = entry.getValue().getNodeLabels();
        if (nodeLabels != null && nodeLabels.size() > 0 && !nodeLabels.contains(nodeLabel)) {
          LOGGER.logDebug(
              "selectCandidateRequestNode: Skip node %s (nodeLabels: %s), label does not match: request label: %s",
              entry.getValue().getHostName(), CommonExtensions.toString(nodeLabels), nodeLabel);
          continue;
        }
      }
      if (gpuTypeList != null) {
        if (nodes.size() > 0) {
          if (!nodes.containsKey(entry.getValue().getHostName())) {
            LOGGER.logWarning(
                "selectCandidateRequestNode: Skip node %s, gpuType not set",
                entry.getValue().getHostName());
            continue;
          }
          String gpuType = (nodes.get(entry.getValue().getHostName())).getGpuType();
          if (!gpuTypeList.contains(gpuType)) {
            LOGGER.logDebug(
                "selectCandidateRequestNode: Skip node %s (gpuType: %s), gpuType doesn't match: request gpuType: %s",
                entry.getValue().getHostName(), gpuType, nodeGpuType);
            continue;
          }
        } else {
          LOGGER.logWarning(
              "selectCandidateRequestNode: cluster gpuType not config, all jobs will ignore user's request gpuType");
        }
      }

      if (request.getMemoryMB() <= entry.getValue().getAvailableMemory() &&
          request.getCpuNumber() <= entry.getValue().getAvailableCpu() &&
          request.getGpuNumber() <= entry.getValue().getAvailableNumGpus()) {
        if (request.getGpuNumber() > 0) {
          // If user specified the candidate gpu, just check the node's available gpus.
          // If user not specified the candidate gpu, use selectCandidateGpu function to pick them.
          Long candidateGpu = requestGpu;

          if (candidateGpu > 0) {
            if ((candidateGpu & entry.getValue().getNodeGpuStatus()) != candidateGpu)
              continue;
          } else {
            candidateGpu = selectCandidateGpu(entry.getValue(), request.getGpuNumber());
            if (Long.bitCount(candidateGpu) != request.getGpuNumber()) {
              continue;
            }
          }
          gpuAllocation = new GpuAllocation();
          gpuAllocation.setNodeName(entry.getValue().getHostName());
          gpuAllocation.setGpuBitmap(candidateGpu);
          break;
        }
      }
    }

    if (gpuAllocation != null) {
      LOGGER.logInfo(
          "selectCandidateRequestNode: select node: " + gpuAllocation.getNodeName() +  " gpuBitmap:" + Long.toBinaryString(gpuAllocation.getGpuBitmap()));
    } else {
      // AM will request resource with any node.
      LOGGER.logInfo(
          "selectCandidateRequestNode: No enough resource");
    }
    return gpuAllocation;
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

  public void addContainerRequest(AMRMClient.ContainerRequest request) throws Exception {

    ResourceDescriptor resource = ResourceDescriptor.fromResource(request.getCapability());
    List<String> nodeList = request.getNodes();
    addContainerRequest(resource, nodeList);
  }

  public void addContainerRequest(ResourceDescriptor resource, List<String> nodeList){
    for (String nodeName : nodeList) {
      if (!candidateRequestNodes.containsKey(nodeName)) {
        LOGGER.logWarning(
            "addContainerRequest: node is not exist: " + nodeName);
        continue;
      }
      candidateRequestNodes.get(nodeName).addContainerRequest(resource);
    }
  }

  public synchronized void removeContainerRequest(AMRMClient.ContainerRequest request) throws Exception {

    ResourceDescriptor resource = ResourceDescriptor.fromResource(request.getCapability());
    List<String> nodeList = request.getNodes();

    for (String nodeName : nodeList) {
      if (!candidateRequestNodes.containsKey(nodeName)) {
        LOGGER.logWarning(
            "removeContainerRequest: node is not exist: " + nodeName);
        continue;
      }
      candidateRequestNodes.get(nodeName).removeContainerRequest(resource);
      return;
    }
  }
}
