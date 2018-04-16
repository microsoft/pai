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

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.model.ValueRange;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SelectionResult {

  private Map<String, Long> nodes = new HashMap<String, Long>();
  private List<ValueRange> overlapPorts = new ArrayList<ValueRange>();
  private ResourceDescriptor optimizedResource = ResourceDescriptor.newInstance(0, 0, 0, (long) 0);

  public void addSelection(String hostName, Long gpuAttribute, List<ValueRange> ports) {
    if (nodes.isEmpty()) {
      nodes.put(hostName, gpuAttribute);
      overlapPorts = ValueRangeUtils.coalesceRangeList(ports);
      return;
    }
    if (nodes.containsKey(hostName)) {
      nodes.remove(hostName);
    }
    nodes.put(hostName, gpuAttribute);
    overlapPorts = ValueRangeUtils.intersectRangeList(overlapPorts, ports);
  }

  public List<ValueRange> getOverlapPorts() {
    return overlapPorts;
  }

  public List<String> getNodeHosts() {
    return new ArrayList<>(nodes.keySet());
  }

  public Long getGpuAttribute(String hostName) {
    return nodes.get(hostName);
  }

  public ResourceDescriptor getOptimizedResource() {
    return optimizedResource;
  }

  public void setOptimizedResource(ResourceDescriptor optimizedResource) {
    this.optimizedResource = optimizedResource;
  }

  @Override
  public String toString() {
    String output = String.format("SelectionResult: [OptimizedResource: %s]", optimizedResource);
    for (Map.Entry<String, Long> entry : nodes.entrySet()) {
      output += String.format(" [Host: %s GpuAttribute: %s]", entry.getKey(), CommonExts.toStringWithBits(entry.getValue()));
    }
    return output;
  }
}
