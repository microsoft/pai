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

import com.google.common.annotations.VisibleForTesting;
import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.ClusterConfiguration;
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.apache.hadoop.yarn.api.records.NodeReport;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;
import com.microsoft.frameworklauncher.common.model.*;

import java.util.*;

/**
 * Based on:
 * RM's all running nodes' status {@link NodeReport}
 * AM's all outstanding requested container requests {@link ContainerRequest}
 * Given:
 * A Task's raw request {@link ResourceDescriptor}
 * Provides:
 * The {@link SelectionResult} which helps to construct the {@link ContainerRequest}
 * for the Task to request container.
 */
public class SelectionManager { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(SelectionManager.class);

  private final ApplicationMaster am;
  private final LinkedHashMap<String, Node> allNodes = new LinkedHashMap<>();
  private final LinkedHashMap<String, ResourceDescriptor> localTriedResource = new LinkedHashMap<>();
  private final LinkedHashMap<String, List<ValueRange>> requestedPortsCache = new LinkedHashMap<>();

  private final List<String> filteredNodes = new ArrayList<String>();

  public SelectionManager(ApplicationMaster am) {
    this.am = am;
  }

  public synchronized void addNode(NodeReport nodeReport) throws Exception {
    addNode(Node.fromNodeReport(nodeReport));
  }

  private void randomizeNodes() {

    filteredNodes.clear();
    for (String nodeName : allNodes.keySet()) {
      filteredNodes.add(nodeName);
    }
    int randomTimes = filteredNodes.size();
    while (randomTimes-- > 0) {
      int randomIndex = Math.abs(new Random().nextInt(filteredNodes.size()));
      filteredNodes.add(filteredNodes.remove(randomIndex));
    }
  }

  private void filterNodesByNodeLabel(String requestNodeLabel) {
    if (requestNodeLabel != null) {
      for (int i = filteredNodes.size(); i > 0; i--) {
        Set<String> availableNodeLabels = allNodes.get(filteredNodes.get(i - 1)).getLabels();
        if (!HadoopUtils.matchNodeLabel(requestNodeLabel, availableNodeLabels)) {
          LOGGER.logDebug("NodeLabel does not match: Node: [%s] Request NodeLabel: [%s]",
              filteredNodes.get(i - 1), requestNodeLabel);
          filteredNodes.remove(i - 1);
        }
      }
    }
  }

  private void filterNodesByGpuType(String requestNodeGpuType) {
    if (requestNodeGpuType != null) {
      Map<String, NodeConfiguration> configuredNodes = am.getClusterConfiguration().getNodes();
      if (configuredNodes != null) {
        for (int i = filteredNodes.size(); i > 0; i--) {
          String nodeHost = filteredNodes.get(i - 1);
          if (!configuredNodes.containsKey(nodeHost)) {
            LOGGER.logDebug("Node:[%s] is not found in clusterConfiguration: Request NodeGpuType: [%s]", nodeHost, requestNodeGpuType);
            filteredNodes.remove(i - 1);
            continue;
          }
          List<String> requestNodeGpuTypes = Arrays.asList(requestNodeGpuType.split(","));
          String availableNodeGpuType = configuredNodes.get(nodeHost).getGpuType();
          if (!requestNodeGpuTypes.contains(availableNodeGpuType)) {
            LOGGER.logDebug("NodeGpuType does not match: Node: [%s] Request NodeGpuType: [%s], Available NodeGpuType: [%s]",
                nodeHost, requestNodeGpuType, availableNodeGpuType);
            filteredNodes.remove(i - 1);
            continue;
          }
        }
      }
    }
  }

  private void filterNodesForNonGpuJob(ResourceDescriptor jobTotalRequestResource) {
    if (jobTotalRequestResource != null && jobTotalRequestResource.getGpuNumber() == 0) {
      for (int i = filteredNodes.size(); i > 0; i--) {
        Node node = allNodes.get(filteredNodes.get(i - 1));
        ResourceDescriptor totalResource = node.getTotalResource();
        if (totalResource.getGpuNumber() > 0) {
          LOGGER.logDebug("skip nodes with Gpu resource for non-gpu job: Node [%s], Job request resource: [%s], Node total tesource: [%s]",
              node.getHost(), jobTotalRequestResource, totalResource);
          filteredNodes.remove(i - 1);
        }
      }
    }
  }

  private void filterNodesByResource(ResourceDescriptor requestResource, Boolean skipLocalTriedResource) {
    if (requestResource != null) {
      for (int i = filteredNodes.size(); i > 0; i--) {
        Node node = allNodes.get(filteredNodes.get(i - 1));
        ResourceDescriptor availableResource = node.getAvailableResource();
        if (skipLocalTriedResource && localTriedResource.containsKey(node.getHost())) {
          LOGGER.logDebug("Skip local tried resources: [%s] on Node : [%s]", localTriedResource.get(node.getHost()), node.getHost());
          ResourceDescriptor.subtractFrom(availableResource, localTriedResource.get(node.getHost()));
        }
        if (!ResourceDescriptor.fitsIn(requestResource, availableResource)) {
          LOGGER.logDebug("Resource does not fit in: Node: [%s] Request Resource: [%s], Available Resource: [%s]",
              node.getHost(), requestResource, availableResource);
          filteredNodes.remove(i - 1);
        }
      }
    }
  }

  private void filterNodesByRackSelectionPolicy(ResourceDescriptor requestResource, int pendingTaskNumber) {
    //TODO: Node GPU policy filter the nodes;
  }

  private SelectionResult SelectNodes(ResourceDescriptor requestResource, int pendingTaskNumber) {
    //TODO: apply other node selection policy in  the futher;
    return selectNodesByJobPacking(requestResource, pendingTaskNumber);
  }

  //Default Node Selection strategy.
  private SelectionResult selectNodesByJobPacking(ResourceDescriptor requestResource, int pendingTaskNumber) {

    int requestNumber = pendingTaskNumber * am.getConfiguration().getLauncherConfig().getAmSearchNodeBufferFactor();
    List<Node> candidateNodes = new ArrayList<Node>();
    SelectionResult result = new SelectionResult();
    for (String nodeName : filteredNodes) {
      candidateNodes.add(allNodes.get(nodeName));
    }
    Collections.sort(candidateNodes);
    for (int i = 0; i < requestNumber && i < candidateNodes.size(); i++) {
      Node select = candidateNodes.get(i);
      Long gpuAttribute = requestResource.getGpuAttribute();
      if (gpuAttribute == 0) {
        gpuAttribute = selectCandidateGpuAttribute(select, requestResource.getGpuNumber());
      }
      result.addSelection(select.getHost(), gpuAttribute, select.getAvailableResource().getPortRanges());
    }
    return result;
  }

  public synchronized SelectionResult select(ResourceDescriptor requestResource, String taskRoleName) throws NotAvailableException {

    LOGGER.logInfo(
        "select: TaskRole: [%s] Resource: [%s]", taskRoleName, requestResource);
    String requestNodeLabel = am.getRequestManager().getTaskPlatParams().get(taskRoleName).getTaskNodeLabel();
    String requestNodeGpuType = am.getRequestManager().getTaskPlatParams().get(taskRoleName).getTaskNodeGpuType();
    int pendingTaskNumber = am.getStatusManager().getUnAllocatedTaskCount(taskRoleName);
    List<ValueRange> reUsePorts = null;

    // Prefer to use previous successfully allocated ports. if no successfully ports, try to re-use the "Requesting" ports.
    if (am.getRequestManager().getTaskRoles().get(taskRoleName).getUseTheSamePorts()) {
      reUsePorts = am.getStatusManager().getAllocatedTaskPorts(taskRoleName);
      if (ValueRangeUtils.getValueNumber(reUsePorts) <= 0 && requestedPortsCache.containsKey(taskRoleName)) {
        reUsePorts = requestedPortsCache.get(taskRoleName);
        // the cache only guide the next task to use previous requesting port.
        requestedPortsCache.remove(taskRoleName);
      }
    }
    SelectionResult result = select(requestResource, requestNodeLabel, requestNodeGpuType, pendingTaskNumber, reUsePorts);
    if (!requestedPortsCache.containsKey(taskRoleName) && pendingTaskNumber > 1)
      requestedPortsCache.put(taskRoleName, result.getOptimizedResource().getPortRanges());
    return result;
  }

  @VisibleForTesting
  public synchronized SelectionResult select(ResourceDescriptor requestResource, String requestNodeLabel, String requestNodeGpuType, int pendingTaskNumber) throws NotAvailableException {
    return select(requestResource, requestNodeLabel, requestNodeGpuType, pendingTaskNumber, null);
  }

  public synchronized SelectionResult select(ResourceDescriptor requestResource, String requestNodeLabel, String requestNodeGpuType,
      int pendingTaskNumber, List<ValueRange> reUsePorts) throws NotAvailableException {

    LOGGER.logInfo(
        "select: Request: Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s], TaskNumber: [%d], ReUsePorts: [%s]",
        requestResource, requestNodeLabel, requestNodeGpuType, pendingTaskNumber, ValueRangeUtils.toString(reUsePorts));

    randomizeNodes();
    filterNodesByNodeLabel(requestNodeLabel);
    filterNodesByGpuType(requestNodeGpuType);
    if (!am.getConfiguration().getLauncherConfig().getAmAllowNoneGpuJobOnGpuNode()) {
      ResourceDescriptor jobTotalRequestResource = am.getRequestManager().getJobTotalCountableResources();
      filterNodesForNonGpuJob(jobTotalRequestResource);
    }

    ResourceDescriptor optimizedRequestResource = YamlUtils.deepCopy(requestResource, ResourceDescriptor.class);
    if (ValueRangeUtils.getValueNumber(reUsePorts) > 0) {
      LOGGER.logInfo(
          "select: re-use pre-allocated ports: [%s]", ValueRangeUtils.toString(reUsePorts));
      optimizedRequestResource.setPortRanges(reUsePorts);
    }

    filterNodesByResource(optimizedRequestResource, am.getConfiguration().getLauncherConfig().getAmSkipLocalTriedResource());

    filterNodesByRackSelectionPolicy(optimizedRequestResource, pendingTaskNumber);
    if (filteredNodes.size() < 1) {
      //don't have candidate nodes for this request.
      if (requestNodeGpuType != null || requestResource.getPortNumber() > 0) {
        //If gpuType or portNumber is specified, abort this request and try later.
        throw new NotAvailableException(String.format("Don't have enough nodes to fix in optimizedRequestResource:%s, NodeGpuType: [%s]",
            optimizedRequestResource, requestNodeGpuType));
      }
    }
    SelectionResult selectionResult = SelectNodes(optimizedRequestResource, pendingTaskNumber);
    List<ValueRange> portRanges = allocatePorts(selectionResult, optimizedRequestResource);
    optimizedRequestResource.setPortRanges(portRanges);
    selectionResult.setOptimizedResource(optimizedRequestResource);
    return selectionResult;
  }

  public List<ValueRange> allocatePorts(SelectionResult selectionResult, ResourceDescriptor optimizedRequestResource) throws NotAvailableException {
    // If the port was not allocated and was not specified previously, need allocate the ports for this task.
    if (ValueRangeUtils.getValueNumber(optimizedRequestResource.getPortRanges()) <= 0 && optimizedRequestResource.getPortNumber() > 0) {
      List<ValueRange> newCandidatePorts = ValueRangeUtils.getSubRange(selectionResult.getOverlapPorts(), optimizedRequestResource.getPortNumber(),
          am.getConfiguration().getLauncherConfig().getAmContainerBasePort());

      if (ValueRangeUtils.getValueNumber(newCandidatePorts) >= optimizedRequestResource.getPortNumber()) {
        LOGGER.logDebug("Allocated port: optimizedRequestResource: [%s]", optimizedRequestResource);
        return newCandidatePorts;
      } else {
        throw new NotAvailableException("The selected candidate nodes don't have enough ports");
      }
    }
    return optimizedRequestResource.getPortRanges();
  }

  @VisibleForTesting
  public synchronized Long selectCandidateGpuAttribute(Node node, Integer requestGpuNumber) {
    ResourceDescriptor nodeAvailable = node.getAvailableResource();
    assert (requestGpuNumber <= nodeAvailable.getGpuNumber());

    Long selectedGpuAttribute = 0L;
    Long availableGpuAttribute = nodeAvailable.getGpuAttribute();

    // By default, using the simple sequential selection.
    // To improve it, considers the Gpu topology structure, find a node which can minimize
    // the communication cost among Gpus;
    for (int i = 0; i < requestGpuNumber; i++) {
      selectedGpuAttribute += (availableGpuAttribute - (availableGpuAttribute & (availableGpuAttribute - 1)));
      availableGpuAttribute &= (availableGpuAttribute - 1);
    }
    return selectedGpuAttribute;
  }

  @VisibleForTesting
  public synchronized void addNode(Node reportedNode) {
    if (!allNodes.containsKey(reportedNode.getHost())) {
      LOGGER.logDebug("addNode: %s", reportedNode);
      allNodes.put(reportedNode.getHost(), reportedNode);
    } else {
      Node existNode = allNodes.get(reportedNode.getHost());
      existNode.updateFromReportedNode(reportedNode);
      LOGGER.logDebug("addNode: %s ", existNode);
    }
  }

  public synchronized void removeNode(NodeReport nodeReport) throws Exception {
    removeNode(Node.fromNodeReport(nodeReport));
  }

  @VisibleForTesting
  public synchronized void removeNode(Node reportedNode) {
    if (allNodes.containsKey(reportedNode.getHost())) {
      LOGGER.logDebug("removeNode: %s", reportedNode);
      allNodes.remove(reportedNode.getHost());
    }
  }

  // Add outstanding requested container request
  public synchronized void addContainerRequest(ContainerRequest request) throws Exception {
    addContainerRequest(
        ResourceDescriptor.fromResource(request.getCapability()),
        request.getNodes());
  }

  @VisibleForTesting
  public synchronized void addContainerRequest(ResourceDescriptor resource, List<String> nodeHosts) {
    for (String nodeHost : nodeHosts) {
      if (allNodes.containsKey(nodeHost)) {
        allNodes.get(nodeHost).addContainerRequest(resource);
        if (!localTriedResource.containsKey(nodeHost)) {
          localTriedResource.put(nodeHost, YamlUtils.deepCopy(resource, ResourceDescriptor.class));
        } else {
          ResourceDescriptor triedResource = localTriedResource.get(nodeHost);
          ResourceDescriptor.addTo(triedResource, resource);
        }
      } else {
        LOGGER.logWarning("addContainerRequest: Node is no longer a candidate: %s", nodeHost);
      }
    }
  }

  // Remove outstanding requested container request
  public synchronized void removeContainerRequest(ContainerRequest request) throws Exception {
    removeContainerRequest(
        ResourceDescriptor.fromResource(request.getCapability()),
        request.getNodes());
  }

  @VisibleForTesting
  public synchronized void removeContainerRequest(ResourceDescriptor resource, List<String> nodeHosts) {
    for (String nodeHost : nodeHosts) {
      if (allNodes.containsKey(nodeHost)) {
        allNodes.get(nodeHost).removeContainerRequest(resource);
      } else {
        LOGGER.logWarning("removeContainerRequest: Node is no longer a candidate: %s", nodeHost);
      }
    }
  }
}
