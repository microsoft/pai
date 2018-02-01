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
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
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
  private final LinkedHashMap<String, Node> candidateNodes = new LinkedHashMap<>();

  public SelectionManager(ApplicationMaster am) {
    this.am = am;
  }

  public synchronized void addCandidateNode(NodeReport nodeReport) throws Exception {
    addCandidateNode(Node.fromNodeReport(nodeReport));
  }

  @VisibleForTesting
  public synchronized void addCandidateNode(Node reportedNode) {
    if (!candidateNodes.containsKey(reportedNode.getHost())) {
      LOGGER.logDebug("addCandidateNode: %s", reportedNode);
      candidateNodes.put(reportedNode.getHost(), reportedNode);
    } else {
      Node existNode = candidateNodes.get(reportedNode.getHost());
      existNode.updateFromReportedNode(reportedNode);
      LOGGER.logDebug("updateCandidateNode: %s ", existNode);
    }
  }

  public synchronized void removeCandidateNode(NodeReport nodeReport) throws Exception {
    removeCandidateNode(Node.fromNodeReport(nodeReport));
  }

  @VisibleForTesting
  public synchronized void removeCandidateNode(Node reportedNode) {
    if (candidateNodes.containsKey(reportedNode.getHost())) {
      LOGGER.logDebug("removeCandidateNode: %s", reportedNode);
      candidateNodes.remove(reportedNode.getHost());
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
      if (candidateNodes.containsKey(nodeHost)) {
        candidateNodes.get(nodeHost).addContainerRequest(resource);
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
      if (candidateNodes.containsKey(nodeHost)) {
        candidateNodes.get(nodeHost).removeContainerRequest(resource);
      } else {
        LOGGER.logWarning("removeContainerRequest: Node is no longer a candidate: %s", nodeHost);
      }
    }
  }

  public synchronized SelectionResult select(
      ResourceDescriptor requestResource, String requestNodeLabel, String requestNodeGpuType)
      throws NotAvailableException {
    LOGGER.logInfo(
        "select: Given Request: Resource: [%s], NodeLabel: [%s], NodeGpuType: [%s]",
        requestResource, requestNodeLabel, requestNodeGpuType);

    // ClusterConfiguration is ready when this method is called, i.e. it is not null here.
    ClusterConfiguration clusterConfiguration = am.getClusterConfiguration();
    Map<String, NodeConfiguration> configuredNodes = clusterConfiguration.getNodes();

    // Start to select from candidateNodes
    SelectionResult selectionResult = null;
    for (Node node : candidateNodes.values()) {
      String nodeHost = node.getHost();
      String logPrefix = String.format("select: [%s]: Test Node: ", nodeHost);
      String rejectedLogPrefix = logPrefix + "Rejected: Reason: ";

      LOGGER.logDebug(logPrefix + "Start: %s", node);

      // Test NodeLabel
      Set<String> availableNodeLabels = node.getLabels();
      if (!HadoopUtils.matchNodeLabel(requestNodeLabel, availableNodeLabels)) {
        LOGGER.logDebug(rejectedLogPrefix +
                "NodeLabel does not match: Request NodeLabel: [%s], Available NodeLabel: [%s]",
            requestNodeLabel, CommonExts.toString(availableNodeLabels));
        continue;
      }

      // Test NodeGpuType
      if (requestNodeGpuType != null) {
        if (configuredNodes != null) {
          if (!configuredNodes.containsKey(nodeHost)) {
            LOGGER.logDebug(rejectedLogPrefix +
                    "Node is not found in configured Nodes: Request NodeGpuType: [%s]",
                requestNodeGpuType);
            continue;
          }

          List<String> requestNodeGpuTypes = Arrays.asList(requestNodeGpuType.split(","));
          String availableNodeGpuType = configuredNodes.get(nodeHost).getGpuType();
          if (!requestNodeGpuTypes.contains(availableNodeGpuType)) {
            LOGGER.logDebug(rejectedLogPrefix +
                    "NodeGpuType does not match: Request NodeGpuType: [%s], Available NodeGpuType: [%s]",
                requestNodeGpuType, availableNodeGpuType);
            continue;
          }
        } else {
          LOGGER.logWarning(logPrefix +
                  "Configured Nodes is not found in ClusterConfiguration: Ignore Request NodeGpuType: [%s]",
              requestNodeGpuType);
        }
      }

      // Test Resource
      ResourceDescriptor availableResource = node.getAvailableResource();
      if (!ResourceDescriptor.fitsIn(requestResource, availableResource)) {
        LOGGER.logDebug(rejectedLogPrefix +
                "Resource does not fit in: Request Resource: [%s], Available Resource: [%s]",
            requestResource, availableResource);
        continue;
      }

      // Test Optimized Resource
      ResourceDescriptor optimizedRequestResource = YamlUtils.deepCopy(requestResource, ResourceDescriptor.class);
      if (requestResource.getGpuAttribute() == 0) {
        // If GpuAttribute is not explicitly specified, we select an optimal GpuAttribute according to 
        // the current status of the node instead of let RM to select a random GpuAttribute.
        optimizedRequestResource.setGpuAttribute(selectCandidateGpuAttribute(node, requestResource.getGpuNumber()));
        if (!ResourceDescriptor.fitsIn(optimizedRequestResource, availableResource)) {
          LOGGER.logDebug(rejectedLogPrefix +
                  "Resource does not fit in: Optimized Request Resource: [%s], Available Resource: [%s]",
              optimizedRequestResource, availableResource);
          continue;
        }
      }

      // Found a selectionResult passed all the Tests above
      selectionResult = new SelectionResult();
      selectionResult.setNodeHost(nodeHost);
      selectionResult.setGpuAttribute(optimizedRequestResource.getGpuAttribute());
      break;
    }

    if (selectionResult != null) {
      LOGGER.logInfo(
          "select: Found a SelectionResult satisfies the Request: SelectionResult: [%s]",
          selectionResult);
    } else {
      LOGGER.logWarning(
          "select: Cannot found a SelectionResult satisfies the Request: " +
              "Check whether the Request can be relaxed to RM");
      String notRelaxLogPrefix = "select: The Request cannot be relaxed to RM: Reason: ";

      // Test NodeGpuType
      if (requestNodeGpuType != null) {
        throw new NotAvailableException(
            String.format(notRelaxLogPrefix +
                    "NodeGpuType is specified: Request NodeGpuType: [%s]",
                requestNodeGpuType));
      }

      LOGGER.logWarning(
          "select: The Request will be relaxed to RM");
    }
    
    return selectionResult;
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
}
