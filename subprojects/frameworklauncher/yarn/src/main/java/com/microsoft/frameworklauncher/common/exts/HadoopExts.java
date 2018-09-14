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

package com.microsoft.frameworklauncher.common.exts;

import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;

public class HadoopExts {
  public static String toString(Resource res) throws Exception {
    return ResourceDescriptor.fromResource(res).toString();
  }

  public static String toString(Priority priority) {
    if (priority != null) {
      return Integer.toString(priority.getPriority());
    } else {
      return null;
    }
  }

  public static String toString(ContainerRequest req) throws Exception {
    return String.format("Priority: [%s]", toString(req.getPriority())) + " " +
        String.format("Resource: %s", toString(req.getCapability())) + " " +
        String.format("NodeLabel: [%s]", req.getNodeLabelExpression()) + " " +
        String.format("RelaxLocality: [%s]", req.getRelaxLocality()) + " " +
        String.format("HostNames: %s", CommonExts.toString(req.getNodes())) + " " +
        String.format("RackNames: %s", CommonExts.toString(req.getRacks()));
  }

  public static String toString(ResourceRequest req) throws Exception {
    return String.format("Priority: [%s]", toString(req.getPriority())) + " " +
        String.format("Resource: %s", toString(req.getCapability())) + " " +
        String.format("NodeLabel: [%s]", req.getNodeLabelExpression()) + " " +
        String.format("RelaxLocality: [%s]", req.getRelaxLocality()) + " " +
        String.format("ResourceName: [%s]", req.getResourceName()) + " " +
        String.format("ContainerNum: [%s]", req.getNumContainers());
  }

  public static String toString(NodeId nodeId) {
    return String.format("HostName: [%s]", nodeId.getHost()) + " " +
        String.format("Port: [%s]", nodeId.getPort());
  }

  public static String toString(Container container) throws Exception {
    return String.format("ContainerId: [%s]", container.getId().toString()) + " " +
        String.format("Priority: [%s]", toString(container.getPriority())) + " " +
        String.format("Resource: %s", toString(container.getResource())) + " " +
        String.format("NodeId: [%s]", toString(container.getNodeId()));
  }
}
