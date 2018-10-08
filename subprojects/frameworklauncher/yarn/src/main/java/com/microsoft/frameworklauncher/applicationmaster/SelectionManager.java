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
import com.microsoft.frameworklauncher.common.definition.TaskStateDefinition;
import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
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

  private final ApplicationMaster am;
  private final LauncherConfiguration conf;
  private final StatusManager statusManager;
  private final RequestManager requestManager;

  /**
   * REGION StateVariable
   */
  private final Map<String, Node> allNodes = new HashMap<>();
  private final Map<String, ResourceDescriptor> localTriedResource = new HashMap<>();
  private final Map<String, List<ValueRange>> previousRequestedPorts = new HashMap<>();
  private final List<String> filteredNodes = new ArrayList<>();
  private int reusedPortsTimes = 0;

  public SelectionManager(
      ApplicationMaster am, Configuration conf,
      StatusManager statusManager, RequestManager requestManager) {
    this.am = am;
    this.conf = conf.getLauncherConfig();
    this.statusManager = statusManager;
    this.requestManager = requestManager;
  }

  public synchronized void addNode(NodeReport nodeReport) throws Exception {
    addNode(Node.fromNodeReport(nodeReport));
  }

  private void initFilteredNodes() {
    filteredNodes.clear();
    filteredNodes.addAll(allNodes.keySet());
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
          LOGGER.logDebug("Skip local tried resources: [%s] on Node: [%s]", localTriedResource.get(node.getHost()), node.getHost());
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
    //TODO: Node Gpu policy filter the nodes;
  }

  private SelectionResult selectNodes(ResourceDescriptor requestResource, int startStatesTaskCount) {
    //TODO: apply other node selection policy in the future;
    return selectNodesByJobPacking(requestResource, startStatesTaskCount);
  }

  //Default Node Selection strategy.
  private SelectionResult selectNodesByJobPacking(ResourceDescriptor requestResource, int startStatesTaskCount) {
    int requestNumber = startStatesTaskCount * conf.getAmCandidateNodesFactor();
    List<Node> candidateNodes = new ArrayList<>();
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
      LOGGER.logDebug("selectNodes: Selected candidate: " + node.getHost() + " Node Available gpuAttribute:" +
          CommonExts.toStringWithBits(node.getAvailableResource().getGpuAttribute()) + " Selected gpuAttribute:" + CommonExts.toStringWithBits(gpuAttribute));
      result.addSelection(node.getHost(), gpuAttribute, node.getAvailableResource().getPortRanges());
    }
    return result;
  }

  public synchronized SelectionResult selectSingleNode(String taskRoleName) throws NotAvailableException {
    SelectionResult results = select(taskRoleName);
    if (results.getNodeHosts().size() > 0) {
      // Random pick a host from the result set to avoid conflicted requests for concurrent container requests from different jobs
      ResourceDescriptor optimizedRequestResource = results.getOptimizedResource();
      String candidateNode = results.getNodeHosts().get(CommonUtils.getRandomNumber(0, results.getNodeHosts().size() - 1));
      optimizedRequestResource.setGpuAttribute(results.getGpuAttribute(candidateNode));

      // re-create single node result object.
      SelectionResult result = new SelectionResult();
      result.addSelection(candidateNode, results.getGpuAttribute(candidateNode), results.getOverlapPorts());
      result.setOptimizedResource(optimizedRequestResource);
      LOGGER.logDebug("selectSingleNode: Selected: " + candidateNode + " optimizedRequestResource:" + optimizedRequestResource);
      return result;
    }
    return results;
  }

  public synchronized SelectionResult select(String taskRoleName)
      throws NotAvailableException {
    ResourceDescriptor requestResource = requestManager.getTaskResource(taskRoleName);
    LOGGER.logInfo(
        "select: TaskRole: [%s] Resource: [%s]", taskRoleName, requestResource);
    String requestNodeLabel = requestManager.getTaskRolePlatParams(taskRoleName).getTaskNodeLabel();
    String requestNodeGpuType = requestManager.getTaskRolePlatParams(taskRoleName).getTaskNodeGpuType();
    Map<String, NodeConfiguration> configuredNodes = requestManager.getClusterConfiguration().getNodes();
    Boolean samePortAllocation = requestManager.getTaskRolePlatParams(taskRoleName).getSamePortAllocation();
    int startStatesTaskCount = statusManager.getTaskStatus(TaskStateDefinition.START_STATES, taskRoleName).size();

    // Prefer to use previous successfully associated ports. if no associated ports, try to reuse the "Requesting" ports.
    List<ValueRange> reusedPorts = new ArrayList<>();
    if (samePortAllocation) {
      reusedPorts = statusManager.getAnyLiveAssociatedContainerPorts(taskRoleName);
      if (ValueRangeUtils.getValueNumber(reusedPorts) <= 0 && previousRequestedPorts.containsKey(taskRoleName)) {
        reusedPorts = previousRequestedPorts.get(taskRoleName);
        // the cache only guide the next task to use previous requesting port.
        previousRequestedPorts.remove(taskRoleName);
      }
    }
    SelectionResult result = select(requestResource, requestNodeLabel, requestNodeGpuType, startStatesTaskCount, reusedPorts, configuredNodes);

    if (samePortAllocation) {
      // This startStatesTaskCount also count current task. StartStatesTaskCount == 1 means current task is the last task.
      // reusedPortsTimes is used to avoid startStatesTaskCount not decrease in the situation of timeout tasks back to startStates.
      if (startStatesTaskCount > 1) {
        if (reusedPortsTimes == 0) {
          reusedPortsTimes = startStatesTaskCount;
        }
        // If there has other tasks waiting, push current ports to previousRequestedPorts.
        if (reusedPortsTimes > 1) {
          previousRequestedPorts.put(taskRoleName, result.getOptimizedResource().getPortRanges());
        }
        reusedPortsTimes--;
      }
    }
    return result;
  }

  @VisibleForTesting
  public synchronized SelectionResult select(ResourceDescriptor requestResource, String requestNodeLabel, String requestNodeGpuType,
      int startStatesTaskCount, List<ValueRange> reusedPorts, Map<String, NodeConfiguration> configuredNodes) throws NotAvailableException {

    LOGGER.logInfo(
        "select: Request: Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s], StartStatesTaskCount: [%d], ReusedPorts: [%s]",
        requestResource, requestNodeLabel, requestNodeGpuType, startStatesTaskCount, CommonExts.toString(reusedPorts));

    initFilteredNodes();
    filterNodesByNodeLabel(requestNodeLabel);
    filterNodesByGpuType(configuredNodes, requestNodeGpuType);
    if (!conf.getAmAllowNoneGpuJobOnGpuNode()) {
      int jobTotalRequestGpu = requestManager.getTotalGpuCount();
      filterNodesForNoneGpuJob(jobTotalRequestGpu);
    }

    ResourceDescriptor optimizedRequestResource = YamlUtils.deepCopy(requestResource, ResourceDescriptor.class);
    // Do a first round port allocation:
    // In this round, allocate the common ports from all candidate nodes. if successfully get the ports, and finally not get candidate nodes in
    // next steps, the request will send to RM for node relax. if not successfully get the ports, will try another time after narrow down
    // the candidates.
    if (optimizedRequestResource.getPortNumber() > 0) {
      if (ValueRangeUtils.getValueNumber(reusedPorts) > 0) {
        LOGGER.logInfo(
            "select: reuse pre-selected ports: %s", CommonExts.toString(reusedPorts));
        optimizedRequestResource.setPortRanges(reusedPorts);
        optimizedRequestResource.setPortNumber(0);
      } else {
        List<ValueRange> portRanges = selectPortsFromFilteredNodes(optimizedRequestResource);
        LOGGER.logInfo(
            "select: select ports from all filteredNodes: %s", CommonExts.toString(portRanges));
        if (ValueRangeUtils.getValueNumber(portRanges) == optimizedRequestResource.getPortNumber()) {
          optimizedRequestResource.setPortRanges(ValueRangeUtils.addRange(portRanges, optimizedRequestResource.getPortRanges()));
          optimizedRequestResource.setPortNumber(0);
        }
      }
    }

    filterNodesByResource(optimizedRequestResource, requestManager.getPlatParams().getSkipLocalTriedResource());

    filterNodesByRackSelectionPolicy(optimizedRequestResource, startStatesTaskCount);
    if (filteredNodes.size() < 1) {
      // Don't have candidate nodes for this request.
      if (requestNodeGpuType != null) {
        // GpuType relax is not supported in yarn, the gpuType is specified, abort this request and try later.
        throw new NotAvailableException(String.format(
            "Don't have enough nodes to meet GpuType request: optimizedRequestResource: [%s], NodeGpuType: [%s], NodeLabel: [%s]",
            optimizedRequestResource, requestNodeGpuType, requestNodeLabel));
      }
      if (optimizedRequestResource.getPortNumber() > 0) {
        // Port relax is not supported in yarn, The portNumber is specified, but the port range is not selected, abort this request and try later.
        throw new NotAvailableException(String.format(
            "Don't have enough nodes to meet Port request: optimizedRequestResource: [%s], NodeGpuType: [%s], NodeLabel: [%s]",
            optimizedRequestResource, requestNodeGpuType, requestNodeLabel));
      }
    }
    SelectionResult selectionResult = selectNodes(optimizedRequestResource, startStatesTaskCount);
    //If port is not previous selected, select ports from the selectionResult.
    if (optimizedRequestResource.getPortNumber() > 0) {
      List<ValueRange> portRanges = selectPorts(selectionResult.getOverlapPorts(), optimizedRequestResource);
      if (ValueRangeUtils.getValueNumber(portRanges) == optimizedRequestResource.getPortNumber()) {
        optimizedRequestResource.setPortRanges(ValueRangeUtils.addRange(portRanges, optimizedRequestResource.getPortRanges()));
        optimizedRequestResource.setPortNumber(0);
      } else {
        throw new NotAvailableException(String.format("The selected candidate nodes don't have enough ports, optimizedRequestResource:[%s]",
            optimizedRequestResource));
      }
    }
    selectionResult.setOptimizedResource(optimizedRequestResource);
    return selectionResult;
  }

  private synchronized List<ValueRange> selectPorts(List<ValueRange> availablePorts, ResourceDescriptor optimizedRequestResource) {
    // Remove the user specified static ports from availableProts first, then do the dynamic ports random allocation.
    if (optimizedRequestResource.getPortNumber() > 0) {
      List<ValueRange> availableOverlapPorts = ValueRangeUtils.subtractRange(availablePorts, optimizedRequestResource.getPortRanges());

      List<ValueRange> newCandidatePorts = ValueRangeUtils.getSubRangeRandomly(availableOverlapPorts, optimizedRequestResource.getPortNumber(),
          conf.getAmContainerMinPort());

      if (ValueRangeUtils.getValueNumber(newCandidatePorts) == optimizedRequestResource.getPortNumber()) {
        LOGGER.logDebug("SelectPorts: optimizedRequestResource: [%s]", optimizedRequestResource);
        return newCandidatePorts;
      }
    }
    return new ArrayList<>();
  }

  private List<ValueRange> selectPortsFromFilteredNodes(ResourceDescriptor optimizedRequestResource) {
    if (filteredNodes.size() > 0) {
      List<ValueRange> overlapPorts = allNodes.get(filteredNodes.get(0)).getAvailableResource().getPortRanges();
      for (int i = 1; i < filteredNodes.size(); i++) {
        overlapPorts = ValueRangeUtils.intersectRangeList(overlapPorts, allNodes.get(filteredNodes.get(i)).getAvailableResource().getPortRanges());
      }
      return selectPorts(overlapPorts, optimizedRequestResource);
    }
    return new ArrayList<>();
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
