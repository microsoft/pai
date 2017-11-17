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

package com.microsoft.frameworklauncher.utils;

import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;

public class HadoopExtensions {
  private static int divideAndCeil(int a, int b) {
    if (b == 0) {
      return 0;
    }
    return (a + (b - 1)) / b;
  }

  private static int roundUp(int num, int stepFactor) {
    return divideAndCeil(num, stepFactor) * stepFactor;
  }

  // Only for MEMORY and VIRTUAL_CORES
  private static int normalize(int raw, ResourceType type) throws Exception {
    int min = HadoopUtils.getResourceMinAllocation(type);
    int stepFactor = min;
    int normalized = roundUp(Math.max(raw, min), stepFactor);
    return normalized;
  }

  // Resource
  public static String toString(Resource res) throws Exception {
    return ResourceDescriptor.fromResource(res).toString();
  }

  public static ResourceDescriptor normalize(ResourceDescriptor res) throws Exception {
    ResourceDescriptor normRes = new ResourceDescriptor();
    normRes.setMemoryMB(normalize(res.getMemoryMB(), ResourceType.MEMORY));
    normRes.setCpuNumber(normalize(res.getCpuNumber(), ResourceType.VIRTUAL_CORES));
    normRes.setGpuNumber(res.getGpuNumber());
    normRes.setGpuAttribute(res.getGpuAttribute());
    return normRes;
  }

  public static Boolean equals(Resource res, Resource otherRes) throws Exception {
    if (res == otherRes) {
      return true;
    }
    if (res == null || otherRes == null) {
      return false;
    }

    // All Resource should be Normalized before Compare with Allocated Container Resource,
    // since Allocated Container Resource is Normalized
    ResourceDescriptor normRes = normalize(ResourceDescriptor.fromResource(res));
    ResourceDescriptor normOtherRes = normalize(ResourceDescriptor.fromResource(otherRes));

    Boolean equal = ((normRes.getMemoryMB().intValue() == normOtherRes.getMemoryMB().intValue()) &&
        (normRes.getCpuNumber().intValue() == normOtherRes.getCpuNumber().intValue()) &&
        (normRes.getGpuNumber().intValue() == normOtherRes.getGpuNumber().intValue()));

    if (normRes.getGpuAttribute() != 0 && normOtherRes.getGpuAttribute() != 0) {
      equal = (equal && (normRes.getGpuAttribute().longValue() == normOtherRes.getGpuAttribute().longValue()));
    }

    return equal;
  }

  public static Priority toPriority(Integer priority) {
    return Priority.newInstance(priority);
  }

  public static String toString(Priority priority) {
    String str = "";
    if (priority != null) {
      str = Integer.toString(priority.getPriority());
    }
    return str;
  }

  public static Boolean equals(Priority pri, Priority otherPri) {
    if (pri == otherPri) {
      return true;
    }
    if (pri == null || otherPri == null) {
      return false;
    }

    return pri.getPriority() == otherPri.getPriority();
  }

  public static String toString(ContainerRequest req) throws Exception {
    return
        String.format("Resource: [%s]", toString(req.getCapability())) + " " +
            String.format("Priority: [%s]", toString(req.getPriority())) + " " +
            String.format("NodeLabel: [%s]", req.getNodeLabelExpression()) + " " +
            String.format("HostNames: %s", CommonExtensions.toString(req.getNodes()));
  }

  public static String toString(ResourceRequest req) throws Exception {
    return
        String.format("Resource: [%s]", toString(req.getCapability())) + " " +
            String.format("Priority: [%s]", toString(req.getPriority())) + " " +
            String.format("NodeLabel: [%s]", req.getNodeLabelExpression());
  }

  public static String toString(NodeId nodeId) {
    return
        String.format("HostName: [%s]", nodeId.getHost()) + " " +
            String.format("Port: [%s]", nodeId.getPort());
  }

  public static String toString(Container container) throws Exception {
    return
        String.format("ContainerId: [%s]", container.getId().toString()) + " " +
            String.format("Resource: [%s]", toString(container.getResource())) + " " +
            String.format("NodeId: [%s]", toString(container.getNodeId())) + " " +
            String.format("Priority: [%s]", toString(container.getPriority()));
  }
}
