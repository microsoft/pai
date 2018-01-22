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

import java.util.Set;

public class Node {
  private ResourceDescriptor capacity;
  private final String hostName;
  private ResourceDescriptor used;

  private ResourceDescriptor requested;
  private Set<String> labels;

  public Node(String hostName, Set<String> labels, ResourceDescriptor capacity, ResourceDescriptor used) {
    this.hostName = hostName;
    this.capacity = capacity;
    this.used = used;
    this.labels = labels;
    this.requested = ResourceDescriptor.newInstance(0, 0, 0, (long) 0);
  }

  public void updateNode(Node updateNode) {
    this.capacity = updateNode.getCapacityResource();
    this.used = updateNode.getUsedResource();
  }

  public ResourceDescriptor getCapacityResource() {
    return capacity;
  }

  public ResourceDescriptor getUsedResource() {
    return used;
  }

  public String getHostName() {
    return hostName;
  }

  public Set<String> getNodeLabels() {
    return labels;
  }

  public int getTotalNumGpus() {
    return capacity.getGpuNumber();
  }

  public int getUsedNumGpus() {
    return Long.bitCount(used.getGpuAttribute() | requested.getGpuAttribute());
  }

  public long getNodeGpuStatus() {
    return capacity.getGpuAttribute() & (~(used.getGpuAttribute() | requested.getGpuAttribute()));
  }

  public int getAvailableNumGpus() {
    return capacity.getGpuNumber() - getUsedNumGpus();
  }

  public int getAvailableMemory() {
    return capacity.getMemoryMB() - used.getMemoryMB() - requested.getMemoryMB();
  }

  public int getAvailableCpu() {
    return capacity.getCpuNumber() - used.getCpuNumber() - requested.getCpuNumber();
  }


  public void addContainerRequest(ResourceDescriptor resource) {
    requested.setCpuNumber(requested.getCpuNumber() + resource.getCpuNumber());
    requested.setMemoryMB(requested.getMemoryMB() + resource.getMemoryMB());
    requested.setGpuAttribute(requested.getGpuAttribute() | resource.getGpuAttribute());
    requested.setGpuNumber(requested.getGpuNumber() + resource.getGpuNumber());

  }

  public void removeContainerRequest(ResourceDescriptor resource) {
    requested.setCpuNumber(requested.getCpuNumber() - resource.getCpuNumber());
    requested.setMemoryMB(requested.getMemoryMB() - resource.getMemoryMB());
    requested.setGpuAttribute(requested.getGpuAttribute() & (~resource.getGpuAttribute()));
    requested.setGpuNumber(requested.getGpuNumber() - resource.getGpuNumber());
  }


  @Override
  public String toString() {
    return this.hostName + "(capacity: " + this.capacity + ", used: " + this.used + ", requested:" + this.requested + ")";
  }

  @Override
  public int hashCode() {
    return hostName.hashCode();
  }
}