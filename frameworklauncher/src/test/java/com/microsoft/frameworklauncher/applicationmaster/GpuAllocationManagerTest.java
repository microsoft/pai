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


import com.microsoft.frameworklauncher.common.model.ClusterConfiguration;
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;

import com.microsoft.frameworklauncher.utils.YamlUtils;

import org.apache.hadoop.yarn.api.records.Resource;
import org.junit.Assert;
import org.junit.Test;

import static com.microsoft.frameworklauncher.utils.YamlTestUtils.INPUTS_DIR;

import java.io.FileNotFoundException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.io.*;

public class GpuAllocationManagerTest {
  @Test
  public void testResourceConverter() throws Exception {
    ResourceDescriptor rd = ResourceDescriptor.newInstance(2, 2, 2, 3L);
    Resource res = rd.toResource();

    ResourceDescriptor rd2 = ResourceDescriptor.fromResource(res);

    Assert.assertEquals(2, (int) rd2.getCpuNumber());
    Assert.assertEquals(2, (int) rd2.getMemoryMB());

    try {
      Class<?> clazz = rd2.getClass();
      Method getGpuNumber = clazz.getMethod("getGPUs", int.class);
      Method getGpuAtrribute = clazz.getMethod("getGPUAttribute", long.class);

      Assert.assertEquals(3, (long) getGpuAtrribute.invoke(rd2));
      Assert.assertEquals(2, (int) getGpuNumber.invoke(rd2));
    } catch (NoSuchMethodException | IllegalAccessException ignored) {
    }
  }

  @Test
  public void testGpuAllocationManager() throws Exception {

    Node node1 = new Node("node1", null, ResourceDescriptor.newInstance(2, 2, 2, 3L), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node2 = new Node("node2", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node3 = new Node("node3", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node4 = new Node("node4", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    Node node6 = new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));

    AMForTest am = new AMForTest();
    am.setClusterConfiguration(new ClusterConfiguration());
    GpuAllocationManager gpuMgr = new GpuAllocationManager(am);

    long candidateGPU = gpuMgr.selectCandidateGpu(node1, 1);
    Assert.assertEquals(1L, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGpu(node1, 2);
    Assert.assertEquals(3L, candidateGPU);

    candidateGPU = gpuMgr.selectCandidateGpu(node3, 2);
    Assert.assertEquals(3L, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGpu(node3, 4);
    Assert.assertEquals(0xFL, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGpu(node3, 8);
    Assert.assertEquals(0xFFL, candidateGPU);

    candidateGPU = gpuMgr.selectCandidateGpu(node4, 2);
    Assert.assertEquals(0x30L, candidateGPU);



    SelectionResult result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    //Empty allocation failed;
    Assert.assertEquals(null, result);
    gpuMgr.addCandidateRequestNode(node1);

    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 3, 0L), null, null);
    Assert.assertEquals(null, result);

    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null);
    Assert.assertEquals("node1", result.getNodeName());
    Assert.assertEquals(result.getSelectedGpuBitmap(), 3);
    gpuMgr.addCandidateRequestNode(node3);
    gpuMgr.addCandidateRequestNode(node4);
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 8, 0L), null, null);
    Assert.assertEquals(result.getNodeName(), "node3");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xFF);

    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null);
    Assert.assertEquals(result.getNodeName(), "node4");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF0);

    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null);
    Assert.assertEquals(null, result);

    gpuMgr.addCandidateRequestNode(node2);
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getNodeName(), "node2");
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getNodeName(), "node2");
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(null, result);


    gpuMgr.addCandidateRequestNode(new Node("node5", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    Assert.assertEquals(result.getNodeName(), "node5");
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getNodeName(), "node5");
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(null, result);

    gpuMgr.addCandidateRequestNode(new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    Assert.assertEquals(result.getNodeName(), "node6");
    gpuMgr.removeCandidateRequestNode(node6);
    result = gpuMgr.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(null, result);

    //Allocation with Gpu type lable
    Set<String> tag = new HashSet<String>();

    //Case for node label only
    tag.add("K40");
    tag.add("T40");
    node3 = new Node("node3", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 8, 0xFFL));
    node6 = new Node("node6", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    GpuAllocationManager gpuMgr2 = new GpuAllocationManager(am);

    gpuMgr2.addCandidateRequestNode(node3);
    gpuMgr2.addCandidateRequestNode(node4);
    gpuMgr2.addCandidateRequestNode(node6);

    result = gpuMgr2.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40", null);
    Assert.assertEquals(result.getNodeName(), "node3");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF);
    result = gpuMgr2.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "T40", null);
    Assert.assertEquals(result.getNodeName(), "node3");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF0L);
    //Node label not match
    result = gpuMgr2.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "M40", null);
    Assert.assertEquals(result, null);

    Node node7 = new Node("node7", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    gpuMgr2.addCandidateRequestNode(node7);

    result = gpuMgr2.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "M40", null);
    Assert.assertEquals(result, node7);

    //Case for gpu type config only
    node3 = new Node("node3", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));


    am.initialClusterTestNodes();
    GpuAllocationManager gpuMgr3 = new GpuAllocationManager(am);

    gpuMgr3.addCandidateRequestNode(node3);
    gpuMgr3.addCandidateRequestNode(node4);

    result = gpuMgr3.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "K40");
    Assert.assertEquals("node3", result.getNodeName());
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF);
    result = gpuMgr3.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "T40");
    Assert.assertEquals("node4", result.getNodeName());
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF0);

    //Lable doesn't exist, failed scheduling
    result = gpuMgr2.SelectCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "L40");
    Assert.assertEquals(result, null);
  }

  private class AMForTest extends MockApplicationMaster {
    private ClusterConfiguration clusterConfiguration = new ClusterConfiguration();

    @Override
    protected ClusterConfiguration getClusterConfiguration() {
      return clusterConfiguration;
    }

    public void setClusterConfiguration(ClusterConfiguration clusterConfiguration) {
      this.clusterConfiguration = clusterConfiguration;
    }

    public void initialClusterTestNodes() throws Exception {
      Map<String, NodeConfiguration> map = new HashMap<>();
      NodeConfiguration nodeConfig = new NodeConfiguration();
      nodeConfig.setGpuType("K40");
      map.put("node1", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      nodeConfig.setGpuType("K40");
      map.put("node2", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      nodeConfig.setGpuType("K40");
      map.put("node3", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      nodeConfig.setGpuType("T40");
      map.put("node4", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      nodeConfig.setGpuType("M40");
      map.put("node6", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      nodeConfig.setGpuType("M40");
      map.put("node7", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      this.clusterConfiguration.setNodes(map);
    }
  }
}
