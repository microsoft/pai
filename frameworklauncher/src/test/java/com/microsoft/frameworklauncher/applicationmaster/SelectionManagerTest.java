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


import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.model.ClusterConfiguration;
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.apache.hadoop.yarn.api.records.Resource;
import org.junit.Assert;
import org.junit.Test;

import java.lang.reflect.Method;
import java.util.*;

public class SelectionManagerTest {
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
  public void testSelectionManager() throws Exception {
    Node node1 = new Node("node1", null, ResourceDescriptor.newInstance(2, 2, 2, 3L), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node2 = new Node("node2", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node3 = new Node("node3", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node4 = new Node("node4", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    Node node6 = new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));

    AMForTest am = new AMForTest();
    am.setClusterConfiguration(new ClusterConfiguration());
    SelectionManager sm = new SelectionManager(am);

    long candidateGPU = sm.selectCandidateGpuAttribute(node1, 1);
    Assert.assertEquals(1L, candidateGPU);
    candidateGPU = sm.selectCandidateGpuAttribute(node1, 2);
    Assert.assertEquals(3L, candidateGPU);

    candidateGPU = sm.selectCandidateGpuAttribute(node3, 2);
    Assert.assertEquals(3L, candidateGPU);
    candidateGPU = sm.selectCandidateGpuAttribute(node3, 4);
    Assert.assertEquals(0xFL, candidateGPU);
    candidateGPU = sm.selectCandidateGpuAttribute(node3, 8);
    Assert.assertEquals(0xFFL, candidateGPU);

    candidateGPU = sm.selectCandidateGpuAttribute(node4, 2);
    Assert.assertEquals(0x30L, candidateGPU);

    SelectionResult result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    //Empty allocation failed;
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());
    sm.addCandidateNode(node1);

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 3, 0L), null, null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null);
    Assert.assertEquals("node1", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 3L);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 2, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    sm.addCandidateNode(node3);
    sm.addCandidateNode(node4);
    ResourceDescriptor resourceDescriptor = ResourceDescriptor.newInstance(1, 1, 8, 0L);
    result = sm.select(resourceDescriptor, null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node3");
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xFF);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 8, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node4");
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF0);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    sm.addCandidateNode(node2);
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node2");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node2");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    sm.addCandidateNode(new Node("node5", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node5");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node5");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    sm.addCandidateNode(new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);

    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node6");
    sm.removeCandidateNode(node6);
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    //Allocation with Gpu type label
    Set<String> tag = new HashSet<>();

    //Case for node label only
    tag.add("K40");
    node3 = new Node("node3", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 8, 0xFFL));
    node6 = new Node("node6", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    SelectionManager sm2 = new SelectionManager(am);

    sm2.addCandidateNode(node3);
    sm2.addCandidateNode(node4);
    sm2.addCandidateNode(node6);

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40", null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node3");
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF);

    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40", null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node3");
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF0L);

    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    //Node label not match
    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "M40", null);
    Assert.assertEquals(0, result.getSelectedNodeHosts().size());

    Node node7 = new Node("node7", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    sm2.addCandidateNode(node7);

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null);
    Assert.assertEquals(result.getSelectedNodeHosts().get(0), "node7");

    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    //Case for gpu type config only
    node3 = new Node("node3", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));


    am.initialClusterTestNodes();
    SelectionManager sm3 = new SelectionManager(am);

    sm3.addCandidateNode(node3);
    sm3.addCandidateNode(node4);

    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "K40");
    Assert.assertEquals("node3", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF);

    sm3.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "T40");
    Assert.assertEquals("node4", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF0);

    sm3.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());

    try {
      sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "L40");
      Assert.fail("NodeGpuType should not be relaxed to RM");
    } catch (NotAvailableException ignored) {
    }

    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "L40,T40,K40");
    Assert.assertEquals("node3", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF0);

    SelectionManager sm4 = new SelectionManager(am);

    node6 = new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node7 = new Node("node7", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    sm4.addCandidateNode(node6);
    sm4.addCandidateNode(node7);

    try {
      sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0x33L), null, "K40");
      Assert.fail("NodeGpuType should not be relaxed to RM");
    } catch (NotAvailableException ignored) {
    }

    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0x33L), null, "M40");
    Assert.assertEquals("node6", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0x33);


    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0xFL), null, null);
    Assert.assertEquals("node6", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xFL);
    sm4.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getSelectedNodeHosts().get(0))), result.getSelectedNodeHosts());


    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0xF0L), null, "K40");
    Assert.assertEquals("node7", result.getSelectedNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getSelectedNodeHosts().get(0)).longValue(), 0xF0);
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
      nodeConfig.setGpuType("K40");
      map.put("node7", YamlUtils.deepCopy(nodeConfig, NodeConfiguration.class));
      this.clusterConfiguration.setNodes(map);
    }
  }
}
