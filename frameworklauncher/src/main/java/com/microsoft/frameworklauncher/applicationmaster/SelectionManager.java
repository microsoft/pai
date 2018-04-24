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
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.model.ValueRange;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.apache.hadoop.yarn.api.records.NodeReport;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;

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
  private final Map<String, Node> allNodes = new HashMap<>();
  private final Map<String, ResourceDescriptor> localTriedResource = new HashMap<>();
  private final Map<String, List<ValueRange>> previousRequestedPorts = new HashMap<>();
  private final List<String> filteredNodes = new ArrayList<String>();
  private LauncherConfiguration conf = null;
  private StatusManager statusManager = null;
  private RequestManager requestManager = null;

  private int reusePortsTimes = 0;

  public SelectionManager(LauncherConfiguration conf, StatusManager statusManager, RequestManager requestManager) {
    this.conf = conf;
    this.statusManager = statusManager;
    this.requestManager = requestManager;
  }

  public synchronized void addNode(NodeReport nodeReport) throws Exception {
    addNode(Node.fromNodeReport(nodeReport));
  }

  private void initFilteredNodes() {
    filteredNodes.clear();
    for (String nodeName : allNodes.keySet()) {
      filteredNodes.add(nodeName);
    }
    Collections.shuffle(filteredNodes);
  }

  private void filterNodesByNodeLabel(String requestNodeLabel) {
    if (requestNodeLabel != null) {
      for (int i = filteredNodes.size() - 1; i >= 0; i--) {
        Set<String> availableNodeLabels = allNodes.get(filteredNodes.get(i)).getLabels();
        if (!HadoopUtils.matchNodeLabel(requestNodeLabel, availableNodeLabels)) {
          LOGGER.logDebug("NodeLabel does not match: Node: [%s] Request NodeLabel: [%s]",
              filteredNodes.get(i), requestNodeLabel);
          filteredNodes.remove(i);
        }
      }
    }
  }

  private void filterNodesByGpuType(Map<String, NodeConfiguration> configuredNodes, String requestNodeGpuType) {
    if (requestNodeGpuType != null) {
      if (configuredNodes != null) {
        for (int i = filteredNodes.size() - 1; i >= 0; i--) {
          String nodeHost = filteredNodes.get(i);
          if (!configuredNodes.containsKey(nodeHost)) {
            LOGGER.logDebug("Node:[%s] is not found in clusterConfiguration: Request NodeGpuType: [%s]", nodeHost, requestNodeGpuType);
            filteredNodes.remove(i);
            continue;
          }
          List<String> requestNodeGpuTypes = Arrays.asList(requestNodeGpuType.split(","));
          String availableNodeGpuType = configuredNodes.get(nodeHost).getGpuType();
          if (!requestNodeGpuTypes.contains(availableNodeGpuType)) {
            LOGGER.logDebug("NodeGpuType does not match: Node: [%s] Request NodeGpuType: [%s], Available NodeGpuType: [%s]",
                nodeHost, requestNodeGpuType, availableNodeGpuType);
            filteredNodes.remove(i);
            continue;
          }
        }
      } else {
        LOGGER.logWarning("Configured Nodes is not found in ClusterConfiguration: Ignore Request NodeGpuType: [%s]", requestNodeGpuType);
      }
    }
  }

  private void filterNodesForNoneGpuJob(int jobTotalRequestGpu) {
    if (jobTotalRequestGpu == 0) {
      for (int i = filteredNodes.size() - 1; i >= 0; i--) {
        Node node = allNodes.get(filteredNodes.get(i));
        ResourceDescriptor totalResource = node.getTotalResource();
        if (totalResource.getGpuNumber() > 0) {
          LOGGER.logDebug("skip gpu node for none gpu job: Node [%s], Node total resource: [%s]",
              node.getHost(), totalResource);
          filteredNodes.remove(i);
        }
      }
    }
  }

  private void filterNodesByResource(ResourceDescriptor requestResource, Boolean skipLocalTriedResource) {
    if (requestResource != null) {
      for (int i = filteredNodes.size() - 1; i >= 0; i--) {
        Node node = allNodes.get(filteredNodes.get(i));
        ResourceDescriptor availableResource = YamlUtils.deepCopy(node.getAvailableResource(), ResourceDescriptor.class);
        if (skipLocalTriedResource && localTriedResource.containsKey(node.getHost())) {
          LOGGER.logDebug("Skip local tried resources: [%s] on Node : [%s]", localTriedResource.get(node.getHost()), node.getHost());
          availableResource = ResourceDescriptor.subtract(availableResource, localTriedResource.get(node.getHost()));
        }
        if (!ResourceDescriptor.fitsIn(requestResource, availableResource)) {
          LOGGER.logDebug("Resource does not fit in: Node: [%s] Request Resource: [%s], Available Resource: [%s]",
              node.getHost(), requestResource, availableResource);
          filteredNodes.remove(i);
        }
      }
    }
  }

  private void filterNodesByRackSelectionPolicy(ResourceDescriptor requestResource, int startStatesTaskCount) {
    //TODO: Node GPU policy filter the nodes;
  }

  private SelectionResult selectNodes(ResourceDescriptor requestResource, int startStatesTaskCount) {
    //TODO: apply other node selection policy in the future;
    return selectNodesByJobPacking(requestResource, startStatesTaskCount);
  }

  //Default Node Selection strategy.
  private SelectionResult selectNodesByJobPacking(ResourceDescriptor requestResource, int startStatesTaskCount) {
    int requestNumber = startStatesTaskCount * conf.getAmSearchNodeBufferFactor();
    List<Node> candidateNodes = new ArrayList<Node>();
    SelectionResult result = new SelectionResult();

    for (String nodeName : filteredNodes) {
      candidateNodes.add(allNodes.get(nodeName));
    }
    Collections.sort(candidateNodes);
    for (int i = 0; i < requestNumber && i < candidateNodes.size(); i++) {
      Node node = candidateNodes.get(i);
      Long gpuAttribute = requestResource.getGpuAttribute();
      if (gpuAttribute == 0) {
        gpuAttribute = selectCandidateGpuAttribute(node, requestResource.getGpuNumber());
      }
      result.addSelection(node.getHost(), gpuAttribute, node.getAvailableResource().getPortRanges());
    }
    return result;
  }

  public synchronized SelectionResult selectSingleNode(String taskRoleName) throws NotAvailableException {
    SelectionResult results = select(taskRoleName);
    if (results.getNodeHosts().size() > 1) {
      // Random pick a host from the result set to avoid conflicted requests for concurrent container requests from different jobs
      ResourceDescriptor optimizedRequestResource = results.getOptimizedResource();
      String candidateNode = results.getNodeHosts().get(CommonUtils.getRandomNumber(0, results.getNodeHosts().size() - 1));
      optimizedRequestResource.setGpuAttribute(results.getGpuAttribute(candidateNode));

      // re-create single node result object.
      SelectionResult result = new SelectionResult();
      result.addSelection(candidateNode, results.getGpuAttribute(candidateNode), results.getOverlapPorts());
      result.setOptimizedResource(optimizedRequestResource);
      return result;
    }
    return results;
  }

  public synchronized SelectionResult select(String taskRoleName)
      throws NotAvailableException {
    ResourceDescriptor requestResource = requestManager.getTaskResources().get(taskRoleName);
    LOGGER.logInfo(
        "Select: TaskRole: [%s] Resource: [%s]", taskRoleName, requestResource);
    String requestNodeLabel = requestManager.getTaskPlatParams().get(taskRoleName).getTaskNodeLabel();
    String requestNodeGpuType = requestManager.getTaskPlatParams().get(taskRoleName).getTaskNodeGpuType();
    Map<String, NodeConfiguration> configuredNodes = requestManager.getClusterConfiguration().getNodes();
    int startStatesTaskCount = statusManager.getStartStatesTaskCount(taskRoleName);
    List<ValueRange> reusePorts = null;

    // Prefer to use previous successfully associated ports. if no associated ports, try to reuse the "Requesting" ports.
    if (requestManager.getTaskRoles().get(taskRoleName).getUseTheSamePorts()) {
      reusePorts = statusManager.getLiveAssociatedContainerPorts(taskRoleName);
      if (ValueRangeUtils.getValueNumber(reusePorts) <= 0 && previousRequestedPorts.containsKey(taskRoleName)) {
        reusePorts = previousRequestedPorts.get(taskRoleName);
        // the cache only guide the next task to use previous requesting port.
        previousRequestedPorts.remove(taskRoleName);
      }
    }
    SelectionResult result = select(requestResource, requestNodeLabel, requestNodeGpuType, startStatesTaskCount, reusePorts, configuredNodes);

    if (requestManager.getTaskRoles().get(taskRoleName).getUseTheSamePorts()) {
      // This startStatesTaskCount also count current task. StartStatesTaskCount == 1 means current task is the last task.
      // reusePortsTimes time is used to avoid startStatesTaskCount not decrease in the situation of timeout tasks back to startStates.
      if (startStatesTaskCount > 1) {
        if (reusePortsTimes == 0) {
          reusePortsTimes = startStatesTaskCount;
        }
        // If there has other tasks waiting, push current ports to previousRequestedPorts.
        if (reusePortsTimes > 1) {
          previousRequestedPorts.put(taskRoleName, result.getOptimizedResource().getPortRanges());
        }
        reusePortsTimes--;
      }
    }
    return result;
  }

  @VisibleForTesting
  public synchronized SelectionResult select(ResourceDescriptor requestResource, String requestNodeLabel, String requestNodeGpuType,
      int startStatesTaskCount, List<ValueRange> reusePorts, Map<String, NodeConfiguration> configuredNodes) throws NotAvailableException {

    LOGGER.logInfo(
        "select: Request: Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s], StartStatesTaskCount: [%d], ReusePorts: [%s]",
        requestResource, requestNodeLabel, requestNodeGpuType, startStatesTaskCount, ValueRangeUtils.toString(reusePorts));

    initFilteredNodes();
    filterNodesByNodeLabel(requestNodeLabel);
    filterNodesByGpuType(configuredNodes, requestNodeGpuType);
    if (!conf.getAmAllowNoneGpuJobOnGpuNode()) {
      int jobTotalRequestGpu = requestManager.getTotalGpuCount();
      filterNodesForNoneGpuJob(jobTotalRequestGpu);
    }

    ResourceDescriptor optimizedRequestResource = YamlUtils.deepCopy(requestResource, ResourceDescriptor.class);
    if (ValueRangeUtils.getValueNumber(reusePorts) > 0) {
      LOGGER.logInfo(
          "select: reuse pre-selected ports: [%s]", ValueRangeUtils.toString(reusePorts));
      optimizedRequestResource.setPortRanges(reusePorts);
    }
    if (optimizedRequestResource.getPortNumber() > 0 && ValueRangeUtils.getValueNumber(optimizedRequestResource.getPortRanges()) <= 0) {
      //If port is required and the portRange is not set in previous steps, allocate port ranges from all candidate nodes.
      List<ValueRange> portRanges = selectPortsFromFilteredNodes(optimizedRequestResource);
      LOGGER.logInfo(
          "select: select ports from all filteredNodes  :  [%s]", ValueRangeUtils.toString(portRanges));
      if (ValueRangeUtils.getValueNumber(portRanges) == optimizedRequestResource.getPortNumber()) {
        optimizedRequestResource.setPortRanges(portRanges);
      }
    }

    filterNodesByResource(optimizedRequestResource, conf.getAmSkipLocalTriedResource());

    filterNodesByRackSelectionPolicy(optimizedRequestResource, startStatesTaskCount);
    if (filteredNodes.size() < 1) {
      // Don't have candidate nodes for this request.
      if (requestNodeGpuType != null) {
        // GpuType relax is not supported in yarn, the gpuType is specified, abort this request and try later.
        throw new NotAvailableException(String.format("Don't have enough nodes to meet GpuType request: optimizedRequestResource: [%s], NodeGpuType: [%s], NodeLabel: [%s]",
            optimizedRequestResource, requestNodeGpuType, requestNodeLabel));
      }
      if (optimizedRequestResource.getPortNumber() > 0 && ValueRangeUtils.getValueNumber(optimizedRequestResource.getPortRanges()) <= 0) {
        // Port relax is not supported in yarn, The portNumber is specified, but the port range is not selected, abort this request and try later.
        throw new NotAvailableException(String.format("Don't have enough nodes to meet Port request: optimizedRequestResource: [%s], NodeGpuType: [%s], NodeLabel: [%s]",
            optimizedRequestResource, requestNodeGpuType, requestNodeLabel));
      }
    }
    SelectionResult selectionResult = selectNodes(optimizedRequestResource, startStatesTaskCount);
    //If port is not previous selected, select ports from the selectionResult.
    List<ValueRange> portRanges = selectPorts(selectionResult, optimizedRequestResource);
    optimizedRequestResource.setPortRanges(portRanges);
    selectionResult.setOptimizedResource(optimizedRequestResource);
    return selectionResult;
  }

  private synchronized List<ValueRange> selectPorts(SelectionResult selectionResult, ResourceDescriptor optimizedRequestResource) throws NotAvailableException {
    // If the ports were not selected and was not specified previously, need select the ports for this task.
    if (ValueRangeUtils.getValueNumber(optimizedRequestResource.getPortRanges()) <= 0 && optimizedRequestResource.getPortNumber() > 0) {
      List<ValueRange> newCandidatePorts = ValueRangeUtils.getSubRangeRandomly(selectionResult.getOverlapPorts(), optimizedRequestResource.getPortNumber(),
          conf.getAmContainerMinPort());

      if (ValueRangeUtils.getValueNumber(newCandidatePorts) >= optimizedRequestResource.getPortNumber()) {
        LOGGER.logDebug("SelectPorts: optimizedRequestResource: [%s]", optimizedRequestResource);
        return newCandidatePorts;
      } else {
        throw new NotAvailableException(String.format("The selected candidate nodes don't have enough ports, optimizedRequestResource:[%s]",
            optimizedRequestResource));
      }
    }
    return optimizedRequestResource.getPortRanges();
  }

  private List<ValueRange> selectPortsFromFilteredNodes(ResourceDescriptor optimizedRequestResource) {
    if (filteredNodes.size() > 0) {
      List<ValueRange> overlapPorts = allNodes.get(filteredNodes.get(0)).getAvailableResource().getPortRanges();
      for (int i = 1; i < filteredNodes.size(); i++) {
        overlapPorts = ValueRangeUtils.intersectRangeList(overlapPorts, allNodes.get(filteredNodes.get(i)).getAvailableResource().getPortRanges());
      }
      return ValueRangeUtils.getSubRangeRandomly(overlapPorts, optimizedRequestResource.getPortNumber(),
          conf.getAmContainerMinPort());
    }
    return new ArrayList<ValueRange>();
  }

  @VisibleForTesting
  public synchronized Long selectCandidateGpuAttribute(Node node, Integer requestGpuNumber) {
    ResourceDescriptor nodeAvailable = node.getAvailableResource();
    assert (requestGpuNumber <= nodeAvailable.getGpuNumber());

    Long selectedGpuAttribute = 0L;
    Long availableGpuAttribute = nodeAvailable.getGpuAttribute();

    // By default, using the simple sequential selection.
    // To improve it, considers the Gpu topology structure, find a node which can minimize
    // the communication cost among Gpus.
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
      LOGGER.logDebug("updateNode: %s ", existNode);
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
        if (!localTriedResource.containsKey(nodeHost)) {
          localTriedResource.put(nodeHost, YamlUtils.deepCopy(resource, ResourceDescriptor.class));
        } else {
          ResourceDescriptor triedResource = localTriedResource.get(nodeHost);
          triedResource = ResourceDescriptor.add(triedResource, resource);
          localTriedResource.put(nodeHost, triedResource);
        }
      } else {
        LOGGER.logWarning("removeContainerRequest: Node is no longer a candidate: %s", nodeHost);
      }
    }
  }
}
