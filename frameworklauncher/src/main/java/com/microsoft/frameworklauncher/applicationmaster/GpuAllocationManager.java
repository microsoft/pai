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

import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.utils.DefaultLogger;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class GpuAllocationManager { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(GpuAllocationManager.class);

  // Candidate request host names for this application
  private final LinkedHashMap<String, Node> candidateRequestNodes = new LinkedHashMap<>();

  public void addCandidateRequestNode(Node candidateRequestNode) {
    synchronized (candidateRequestNodes) {
      if (!candidateRequestNodes.containsKey(candidateRequestNode.getHostName())) {
        LOGGER.logInfo("addCandidateRequestNode: %s", candidateRequestNode.getHostName());
        candidateRequestNodes.put(candidateRequestNode.getHostName(), candidateRequestNode);
      } else {
        Node existNode = candidateRequestNodes.get(candidateRequestNode.getHostName());
        existNode.updateNode(candidateRequestNode);
        LOGGER.logInfo("updateCandidateRequestNode: %s ", existNode);
      }
    }
  }

  // According to the request resource, Find a best candidate node.
  // best candidate: for CPU and memory only job request, the first node with the required resource.
  // for GPU request job, consider the GPU topology structure, find a node which can minimum the communication cost between gpus;
  public Node allocateCandidateRequestNode(ResourceDescriptor request, String nodeLabel) {
    synchronized (candidateRequestNodes) {
      Iterator<Map.Entry<String, Node>> iter = candidateRequestNodes.entrySet().iterator();
      TopologyAwareGPUSelector gpuSelector = new TopologyAwareGPUSelector();
      LOGGER.logInfo(
          "allocateCandidateRequestNode: Request resources:" + request.toString());

      int ideaCost = gpuSelector.getIdeaCost(request.getGpuNumber());
      int minCost = Integer.MAX_VALUE;
      Node bestNode = null;
      long bestBitMap = 0;
      while (iter.hasNext()) {
        Map.Entry<String, Node> entry = iter.next();
        LOGGER.logInfo(
            "allocateCandidateRequestNode: Try node: " + entry.getValue().toString());

        if (nodeLabel != null) {
          Set<String> nodeLabels = entry.getValue().getNodeLabels();
          if (!nodeLabels.contains(nodeLabel)) {
            LOGGER.logInfo(
                "allocateCandidateRequestNode: Skip node %s, label does not match:%s",
                entry.getValue().getHostName(), nodeLabel);
            continue;
          }
        }

        if (request.getMemoryMB() <= entry.getValue().getAvailableMemory() &&
            request.getCpuNumber() <= entry.getValue().getAvailableCpu() &&
            request.getGpuNumber() <= entry.getValue().getAvailableNumGpus()) {
          if (request.getGpuNumber() > 0) {
            boolean found = gpuSelector.calculateBestGPUsCandidate(
                request.getGpuNumber(),
                entry.getValue().getTotalNumGpus(),
                entry.getValue().getNodeGpuStatus());
            //Assign GPU
            if (found) {
              if (minCost > gpuSelector.getCandidateCost()) {
                bestNode = entry.getValue();
                minCost = gpuSelector.getCandidateCost();
                bestBitMap = gpuSelector.getCandidateGPUbitmap();
              }
              if (minCost <= ideaCost) {
                break;
              }
            }
          }
          bestNode = entry.getValue();
          break;
        }
      }

      if (bestNode != null) {
        LOGGER.logInfo(
            "allocateCandidateRequestNode: Find resource:" + bestNode.toString() + "  request:" + request.toString());
        bestNode.allocateResource(request, gpuSelector.getCandidateGPUbitmap());
      } else {
        // AM will request resource with any node.  
        LOGGER.logInfo(
            "allocateCandidateRequestNode: No enough resource");
      }

      return bestNode;
    }
  }

  public void removeCandidateRequestNode(Node candidateRequestHost) {
    synchronized (candidateRequestNodes) {
      if (candidateRequestNodes.containsKey(candidateRequestHost.getHostName())) {
        LOGGER.logInfo("removeCandidateRequestNode: %s", candidateRequestHost.getHostName());

        candidateRequestNodes.remove(candidateRequestHost.getHostName());
      }
    }
  }
}
