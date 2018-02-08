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
import com.microsoft.frameworklauncher.common.model.Range;
import com.microsoft.frameworklauncher.common.utils.PortRangeUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public class SelectionResult {

  private Map<String, Long> selectedNodes = new HashMap<String, Long>();
  private List<Range> overlapPorts = new ArrayList<>();

  public void addSelection(String hostName, Long gpuAttribute, List<Range> portList) {
    if (selectedNodes.isEmpty()) {
      selectedNodes.put(hostName, gpuAttribute);
      overlapPorts = PortRangeUtils.coalesceRangeList(portList);
      return;
    }
    if (selectedNodes.containsKey(hostName)) {
      selectedNodes.remove(hostName);
    }
    selectedNodes.put(hostName, gpuAttribute);
    overlapPorts = PortRangeUtils.intersectRangeList(overlapPorts, portList);
  }

  public List<Range> getOverlapPorts() {
    return overlapPorts;
  }

  public List<String> getSelectedNodeHosts() {
    List<String> hostList = new ArrayList<String>();
    for (String hostName : selectedNodes.keySet()) {
      hostList.add(hostName);

    }
    return hostList;
  }

  public Long getGpuAttribute(String hostName) {
    return selectedNodes.get(hostName);
  }


  @Override
  public String toString() {
    String output = "SelectionResult:";
    for (Map.Entry<String, Long> entry : selectedNodes.entrySet()) {
      output += String.format(" [Host: %s GpuAttribute: %s]", entry.getKey(), CommonExts.toStringWithBits(entry.getValue()));
    }
    return output;
  }
}
