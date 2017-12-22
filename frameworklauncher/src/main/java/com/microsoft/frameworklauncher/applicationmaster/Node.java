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
  private final String name;
  private ResourceDescriptor used;
  //localTriedAllocateResource: remember the local tried request, it will remember the tried information don't re-try the same request in a AM life cycle.
  private ResourceDescriptor localAllocatingResource;
  private long selectedGpuBitmap;
  private Set<String> nodeLabels;

  public Node(String name, Set<String> label, ResourceDescriptor capacity, ResourceDescriptor used) {
    this.name = name;
    this.capacity = capacity;
    this.used = used;
    this.selectedGpuBitmap = 0;
    this.nodeLabels = label;
    this.localAllocatingResource = ResourceDescriptor.newInstance(0, 0, 0, (long) 0);
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
    return name;
  }

  public Set<String> getNodeLabels() {
    return nodeLabels;
  }

  public int getTotalNumGpus() {
    return capacity.getGpuNumber();
  }

  public int getUsedNumGpus() {
    return Long.bitCount(used.getGpuAttribute() | localAllocatingResource.getGpuAttribute());
  }

  public long getNodeGpuStatus() {
    return capacity.getGpuAttribute() & (~(used.getGpuAttribute() | localAllocatingResource.getGpuAttribute()));
  }

  public int getAvailableNumGpus() {
    return capacity.getGpuNumber() - getUsedNumGpus();
  }

  public int getAvailableMemory() {
    return capacity.getMemoryMB() - used.getMemoryMB() - localAllocatingResource.getMemoryMB();
  }

  public int getAvailableCpu() {
    return capacity.getCpuNumber() - used.getCpuNumber() - localAllocatingResource.getCpuNumber();
  }

  public long getSelectedGpuBitmap() {
    return selectedGpuBitmap;
  }

  public void allocateResource(ResourceDescriptor resource, long gpuMap) {
    localAllocatingResource.setCpuNumber(localAllocatingResource.getCpuNumber() + resource.getCpuNumber());
    localAllocatingResource.setMemoryMB(localAllocatingResource.getMemoryMB() + resource.getMemoryMB());
    localAllocatingResource.setGpuAttribute(localAllocatingResource.getGpuAttribute() | gpuMap);
    localAllocatingResource.setGpuNumber(localAllocatingResource.getGpuNumber() + resource.getGpuNumber());
    selectedGpuBitmap = gpuMap;
  }

  public void releaseLocalAllocatingResource(ResourceDescriptor resource) {
    localAllocatingResource.setCpuNumber(localAllocatingResource.getCpuNumber() - resource.getCpuNumber());
    localAllocatingResource.setMemoryMB(localAllocatingResource.getMemoryMB() - resource.getMemoryMB());
    localAllocatingResource.setGpuAttribute(localAllocatingResource.getGpuAttribute() & (~resource.getGpuAttribute()));
    localAllocatingResource.setGpuNumber(localAllocatingResource.getGpuNumber() - resource.getGpuNumber());
  }

  @Override
  public String toString() {
    return this.name + "(capacity: " + this.capacity + ", used: " + this.used + ", localAllocatingResource:" + this.localAllocatingResource + ")";
  }

  @Override
  public int hashCode() {
    return name.hashCode();
  }
}