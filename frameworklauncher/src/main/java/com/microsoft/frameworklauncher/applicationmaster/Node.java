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
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import org.apache.hadoop.yarn.api.records.NodeReport;

import java.util.Set;

public class Node implements Comparable<Node> {
  private final String host;
  private Set<String> labels;
  private ResourceDescriptor totalResource;
  private ResourceDescriptor usedResource;
  private ResourceDescriptor requestedResource;

  @VisibleForTesting
  public Node(String host, Set<String> labels, ResourceDescriptor totalResource, ResourceDescriptor usedResource) {
    this.host = host;
    this.labels = labels;
    this.totalResource = totalResource;
    this.usedResource = usedResource;
    this.requestedResource = ResourceDescriptor.newInstance(0, 0, 0, 0L);
  }

  public static Node fromNodeReport(NodeReport nodeReport) throws Exception {
    return new Node(
        nodeReport.getNodeId().getHost(),
        nodeReport.getNodeLabels(),
        ResourceDescriptor.fromResource(nodeReport.getCapability()),
        ResourceDescriptor.fromResource(nodeReport.getUsed()));
  }

  // Compare two node's AvailableResource,  order is Gpu, Cpu, Memory
  @Override
  public int compareTo(Node other) {
    ResourceDescriptor thisAvailableResource = this.getAvailableResource();
    ResourceDescriptor otherAvailableResource = other.getAvailableResource();

    if (thisAvailableResource.getGpuNumber() > otherAvailableResource.getGpuNumber())
      return 1;
    if (thisAvailableResource.getGpuNumber() < otherAvailableResource.getGpuNumber()) {
      return -1;
    }
    if (thisAvailableResource.getCpuNumber() > otherAvailableResource.getCpuNumber()) {
      return 1;
    }
    if (thisAvailableResource.getCpuNumber() < otherAvailableResource.getCpuNumber()) {
      return -1;
    }
    if (thisAvailableResource.getMemoryMB() > otherAvailableResource.getMemoryMB()) {
      return 1;
    }
    if (thisAvailableResource.getMemoryMB() < otherAvailableResource.getMemoryMB()) {
      return -1;
    }
    return 0;
  }

  public void updateFromReportedNode(Node reportedNode) {
    assert (host.equals(reportedNode.getHost()));
    labels = reportedNode.getLabels();
    totalResource = reportedNode.getTotalResource();
    usedResource = reportedNode.getUsedResource();
  }

  public String getHost() {
    return host;
  }

  public Set<String> getLabels() {
    return labels;
  }

  // Guarantees getGpuNumber() == bitCount(getGpuAttribute()), since it is from RM NodeReport.
  public ResourceDescriptor getTotalResource() {
    return totalResource;
  }

  // Guarantees getGpuNumber() == bitCount(getGpuAttribute()), since it is from RM NodeReport.
  public ResourceDescriptor getUsedResource() {
    return usedResource;
  }

  // It is the outstanding Requested Resource, i.e. it does not include the satisfied or canceled request.
  // It does not include the Requested Resource for ANY node, i.e. without a node specified.
  // Guarantees getGpuNumber() == bitCount(getGpuAttribute()), since we do not add a node request without GpuAttribute.
  public ResourceDescriptor getRequestedResource() {
    return requestedResource;
  }

  // AvailableResource = TotalResource - UsedResource - RequestedResource.
  // Guarantees getGpuNumber() == bitCount(getGpuAttribute()), since it comes from sources with the same characteristic.
  public ResourceDescriptor getAvailableResource() {
    return ResourceDescriptor.subtract(
        ResourceDescriptor.subtract(totalResource, usedResource), requestedResource);
  }

  // Add outstanding requested container request.
  public void addContainerRequest(ResourceDescriptor resource) {
    requestedResource = ResourceDescriptor.add(requestedResource, resource);
  }

  // Remove outstanding requested container request.
  public void removeContainerRequest(ResourceDescriptor resource) {
    requestedResource = ResourceDescriptor.subtract(requestedResource, resource);
  }

  @Override
  public String toString() {
    return "{Host: " + host +
        ", Labels: " + CommonExts.toString(labels) +
        ", TotalResource: " + totalResource +
        ", UsedResource: " + usedResource +
        ", RequestedResource: " + requestedResource + "}";
  }

  @Override
  public int hashCode() {
    return host.hashCode();
  }
}