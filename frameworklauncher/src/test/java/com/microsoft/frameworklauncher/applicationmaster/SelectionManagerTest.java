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
import com.microsoft.frameworklauncher.common.model.NodeConfiguration;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.model.ValueRange;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.testutils.FeatureTestUtils;
import com.microsoft.frameworklauncher.zookeeperstore.MockZookeeperStore;
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
    Node node1 = new Node("node1", null, ResourceDescriptor.newInstance(200, 200, 2, 3L), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node2 = new Node("node2", null, ResourceDescriptor.newInstance(200, 200, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node3 = new Node("node3", null, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node4 = new Node("node4", null, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    Node node6 = new Node("node6", null, ResourceDescriptor.newInstance(200, 200, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));

    MockApplicationMaster am = new MockApplicationMaster();
    FeatureTestUtils.initZK(MockZookeeperStore.newInstanceWithClean(FeatureTestUtils.ZK_BASE_DIR));
    am.initialize();

    SelectionManager sm = new SelectionManager(am.conf.getLauncherConfig(), am.statusManager, am.requestManager);

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

    SelectionResult result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null, 1, null, null);

    //Empty allocation failed;
    Assert.assertEquals(0, result.getNodeHosts().size());
    sm.addNode(node1);

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 3, 0L), null, null, 1, null, null);
    Assert.assertEquals(0, result.getNodeHosts().size());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null, 1, null, null);
    Assert.assertEquals("node1", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 3L);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 2, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    sm.addNode(node3);
    sm.addNode(node4);
    ResourceDescriptor resourceDescriptor = ResourceDescriptor.newInstance(1, 1, 8, 0L);
    result = sm.select(resourceDescriptor, null, null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node3");
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xFF);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 8, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node4");
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xF0);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null, 1, null, null);
    Assert.assertEquals(0, result.getNodeHosts().size());

    sm.addNode(node2);
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node2");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node2");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 2, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null, 1, null, null);
    Assert.assertEquals(0, result.getNodeHosts().size());

    sm.addNode(new Node("node5", null, ResourceDescriptor.newInstance(200, 200, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null, 1, null, null);

    Assert.assertEquals(result.getNodeHosts().size(), 2);

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 1, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 2, 0L), null, null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node5");

    sm.addContainerRequest(ResourceDescriptor.newInstance(1, 2, 1, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L), null, null, 1, null, null);
    Assert.assertEquals(2, result.getNodeHosts().size());

    sm.addNode(new Node("node6", null, ResourceDescriptor.newInstance(200, 200, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = sm.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null, 1, null, null);

    Assert.assertEquals(result.getNodeHosts().get(0), "node6");
    sm.addNode(node6);

    //Allocation with Gpu type label
    Set<String> tag = new HashSet<>();

    //Case for node label only
    tag.add("K40");
    node3 = new Node("node3", tag, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", tag, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 8, 0xFFL));
    node6 = new Node("node6", tag, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    SelectionManager sm2 = new SelectionManager(am.conf.getLauncherConfig(), am.statusManager, am.requestManager);

    sm2.addNode(node3);
    sm2.addNode(node4);
    sm2.addNode(node6);

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40", null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().size(), 2);
    if (result.getNodeHosts().get(0).equals("node6")) {
      Assert.assertEquals(240, result.getGpuAttribute(result.getNodeHosts().get(0)).longValue());
      Assert.assertEquals(15, result.getGpuAttribute(result.getNodeHosts().get(1)).longValue());
    }
    if (result.getNodeHosts().get(0).equals("node3")) {
      Assert.assertEquals(15, result.getGpuAttribute(result.getNodeHosts().get(0)).longValue());
      Assert.assertEquals(240, result.getGpuAttribute(result.getNodeHosts().get(1)).longValue());
    }
    List<String> nodeList = new ArrayList<String>();

    nodeList.add(result.getNodeHosts().get(0));
    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), nodeList);

    nodeList.clear();
    nodeList.add(result.getNodeHosts().get(1));
    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(1))), nodeList);

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40", null, 1, null, null);
    Assert.assertEquals(result.getNodeHosts().get(0), "node3");
    Assert.assertEquals(0xF0L, result.getGpuAttribute(result.getNodeHosts().get(0)).longValue());

    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    //Node label not match
    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), "M40", null, 1, null, null);
    Assert.assertEquals(0, result.getNodeHosts().size());

    Node node7 = new Node("node7", null, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    sm2.addNode(node7);

    result = sm2.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, null, 1, null, null);
    Assert.assertEquals("node7", result.getNodeHosts().get(0));

    sm2.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    //Case for gpu type config only
    node3 = new Node("node3", null, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", null, ResourceDescriptor.newInstance(200, 200, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));


    Map<String, NodeConfiguration> gpuNodeConfig = createClusterTestNodes();
    SelectionManager sm3 = new SelectionManager(am.conf.getLauncherConfig(), am.statusManager, am.requestManager);
    sm3.addNode(node3);
    sm3.addNode(node4);

    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "K40", 1, null, gpuNodeConfig);
    Assert.assertEquals("node3", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xF);

    sm3.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "T40", 1, null, gpuNodeConfig);
    Assert.assertEquals("node4", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xF0);

    sm3.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());

    try {
      result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "L40", 1, null, gpuNodeConfig);
      Assert.fail("NodeGpuType should not be relaxed to RM");
    } catch (NotAvailableException e) {
    }
    result = sm3.select(ResourceDescriptor.newInstance(1, 1, 4, 0L), null, "L40,T40,K40", 1, null, gpuNodeConfig);
    Assert.assertEquals("node3", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xF0);

    SelectionManager sm4 = new SelectionManager(am.conf.getLauncherConfig(), am.statusManager, am.requestManager);

    node6 = new Node("node6", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node7 = new Node("node7", null, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    sm4.addNode(node6);
    sm4.addNode(node7);
    try {
      sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0x33L), null, "K40", 1, null, gpuNodeConfig);
      Assert.fail("NodeGpuType should not be relaxed to RM");
    } catch (NotAvailableException ignored) {
    }

    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0x33L), null, "M40", 1, null, gpuNodeConfig);
    Assert.assertEquals("node6", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0x33);


    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0xFL), null, null, 1, null, gpuNodeConfig);
    Assert.assertEquals("node6", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xFL);
    sm4.addContainerRequest(ResourceDescriptor.newInstance(1, 1, 4, result.getGpuAttribute(result.getNodeHosts().get(0))), result.getNodeHosts());


    result = sm4.select(ResourceDescriptor.newInstance(1, 1, 4, 0xF0L), null, "K40", 1, null, gpuNodeConfig);
    Assert.assertEquals("node7", result.getNodeHosts().get(0));
    Assert.assertEquals(result.getGpuAttribute(result.getNodeHosts().get(0)).longValue(), 0xF0);
  }

  @Test
  public void testSelectionManagerWithPorts() throws Exception {
    List<ValueRange> ports = new ArrayList<ValueRange>();
    ports.add(ValueRange.newInstance(2005, 2010));

    List<ValueRange> ports1 = new ArrayList<ValueRange>();
    ports1.add(ValueRange.newInstance(2003, 2005));
    ports1.add(ValueRange.newInstance(2007, 2010));

    List<ValueRange> ports2 = new ArrayList<ValueRange>();
    ports2.add(ValueRange.newInstance(2003, 2005));

    List<ValueRange> ports3 = new ArrayList<ValueRange>();
    ports3.add(ValueRange.newInstance(2010, 2010));

    List<ValueRange> ports4 = new ArrayList<ValueRange>();
    ports4.add(ValueRange.newInstance(2005, 2006));

    Node node1 = new Node("node1", null, ResourceDescriptor.newInstance(2, 2, 2, 3L, 6, ports), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node2 = new Node("node2", null, ResourceDescriptor.newInstance(2, 2, 4, 0xFL, 7, ports1), ResourceDescriptor.newInstance(0, 0, 0, 0L, 3, ports2));

    Map<String, NodeConfiguration> gpuNodeConfig = createClusterTestNodes();

    MockApplicationMaster am = new MockApplicationMaster();
    FeatureTestUtils.initZK(MockZookeeperStore.newInstanceWithClean(FeatureTestUtils.ZK_BASE_DIR));
    am.initialize();

    SelectionManager sm = new SelectionManager(am.conf.getLauncherConfig(), am.statusManager, am.requestManager);
    sm.addNode(node1);
    sm.addNode(node2);

    SelectionResult result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L, 2, null), null, null, 2, null, gpuNodeConfig);
    Assert.assertEquals(2, result.getNodeHosts().size());
    Assert.assertEquals(2007, result.getOverlapPorts().get(0).getBegin().intValue());
    Assert.assertEquals(2010, result.getOverlapPorts().get(0).getEnd().intValue());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L, 2, ports3), null, null, 2, null, gpuNodeConfig);
    Assert.assertEquals(2, result.getNodeHosts().size());
    Assert.assertEquals(2007, result.getOverlapPorts().get(0).getBegin().intValue());
    Assert.assertEquals(2010, result.getOverlapPorts().get(0).getEnd().intValue());

    result = sm.select(ResourceDescriptor.newInstance(1, 1, 1, 0L, 2, ports4), null, null, 1, null, gpuNodeConfig);
    Assert.assertEquals(1, result.getNodeHosts().size());

  }

  public Map<String, NodeConfiguration> createClusterTestNodes() throws Exception {
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
    return map;
  }
}
