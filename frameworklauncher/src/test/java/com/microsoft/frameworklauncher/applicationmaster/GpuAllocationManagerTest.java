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
import com.microsoft.frameworklauncher.utils.CommonUtils;
import com.microsoft.frameworklauncher.utils.YamlUtils;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.hadoop.yarn.api.records.Resource;
import org.junit.Assert;
import org.junit.Test;

import static com.microsoft.frameworklauncher.utils.YamlTestUtils.INPUTS_DIR;

import java.io.FileNotFoundException;
import java.lang.reflect.Method;
import java.util.Set;
import java.util.Map;
import java.io.*;

public class GpuAllocationManagerTest {

  private static final Log LOG =
      LogFactory.getLog(GpuAllocationManagerTest.class);

  @Test
  public void testResourceConvertor() throws Exception {
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
    } catch (Exception ignored) {
    }


  }

  @Test
  public void testGpuAllocationManager() throws Exception {

    Set<String> tag = null;

    Node node1 = new Node("node1", tag, ResourceDescriptor.newInstance(2, 2, 2, 3L), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node2 = new Node("node2", tag, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node3 = new Node("node3", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    Node node4 = new Node("node4", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));
    Node node6 = new Node("node6", tag, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));

    String tempNodeLabelFile = "tempNodeLabel.txt";

    GpuAllocationManager gpuMgr = new GpuAllocationManager(tempNodeLabelFile);

    long candidateGPU = gpuMgr.selectCandidateGPU(node1, 1);
    Assert.assertEquals(1L, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGPU(node1, 2);
    Assert.assertEquals(3L, candidateGPU);

    candidateGPU = gpuMgr.selectCandidateGPU(node3, 2);
    Assert.assertEquals(3L, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGPU(node3, 4);
    Assert.assertEquals(0xFL, candidateGPU);
    candidateGPU = gpuMgr.selectCandidateGPU(node3, 8);
    Assert.assertEquals(0xFFL, candidateGPU);

    candidateGPU = gpuMgr.selectCandidateGPU(node4, 2);
    Assert.assertEquals(0x30L, candidateGPU);

    Node result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    //Empty allocation failed;
    Assert.assertEquals(null, result);
    gpuMgr.addCandidateRequestNode(node1);

    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 3, 0L), null);
    Assert.assertEquals(null, result);

    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 2, 0L), null);
    Assert.assertEquals("node1", result.getHostName());
    Assert.assertEquals(result.getSelectedGpuBitmap(), 3);
    gpuMgr.addCandidateRequestNode(node3);
    gpuMgr.addCandidateRequestNode(node4);
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 8, 0L), null);
    Assert.assertEquals(result.getHostName(), "node3");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xFF);

    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null);
    Assert.assertEquals(result.getHostName(), "node4");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF0);

    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), null);
    Assert.assertEquals(null, result);

    gpuMgr.addCandidateRequestNode(node2);
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(result.getHostName(), "node2");
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(result.getHostName(), "node2");
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(null, result);

    gpuMgr.addCandidateRequestNode(new Node("node5", tag, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(result.getHostName(), "node5");
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(result.getHostName(), "node5");
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(null, result);

    gpuMgr.addCandidateRequestNode(new Node("node6", tag, ResourceDescriptor.newInstance(2, 2, 4, 0xFL), ResourceDescriptor.newInstance(0, 0, 0, 0L)));
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(result.getHostName(), "node6");
    gpuMgr.removeCandidateRequestNode(node6);
    result = gpuMgr.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 1, 0L), null);
    Assert.assertEquals(null, result);

    //Allocation with Gpu type lable

    String nodelabelString = "node1: K40\r\nnode2: K40\r\nnode3: K40\r\nnode4: T40\r\nnode6: M40\r\nnode7: M40\r\n";

    CommonUtils.writeFile(tempNodeLabelFile, nodelabelString);

    node3 = new Node("node3", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 0, 0L));
    node4 = new Node("node4", tag, ResourceDescriptor.newInstance(2, 2, 8, 0xFFL), ResourceDescriptor.newInstance(0, 0, 4, 0xFL));

    GpuAllocationManager gpuMgr2 = new GpuAllocationManager(tempNodeLabelFile);
    gpuMgr2.addCandidateRequestNode(node3);
    gpuMgr2.addCandidateRequestNode(node4);
    result = gpuMgr2.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "K40");
    Assert.assertEquals(result.getHostName(), "node3");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF);
    result = gpuMgr2.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "T40");
    Assert.assertEquals(result.getHostName(), "node4");
    Assert.assertEquals(result.getSelectedGpuBitmap(), 0xF0);

    //Lable doesn't exist, failed scheduling
    result = gpuMgr2.allocateCandidateRequestNode(ResourceDescriptor.newInstance(1, 1, 4, 0L), "L40");
    Assert.assertEquals(result, null);
  }

  @Test
  public void TestGpuLocalLabelParser () throws Exception {
    String configFileName = "GpuTypeTestFile";
    String resultFilePath = INPUTS_DIR + configFileName + ".yml";

      Map resultObject = (Map) YamlUtils.toObject(resultFilePath, Map.class);
      String gpuType = (String) resultObject.get("25.65.179.45");
      Assert.assertEquals("T40", gpuType);
      gpuType = (String) resultObject.get("25.65.179.46");
      Assert.assertEquals("K40", gpuType);
      //case of doesn't exist key
      gpuType = (String) resultObject.get("25.65.179.50");
      Assert.assertEquals(null, gpuType);
  }
}
