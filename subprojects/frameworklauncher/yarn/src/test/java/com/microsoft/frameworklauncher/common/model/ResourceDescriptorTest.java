package com.microsoft.frameworklauncher.common.model;

import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import org.junit.Assert;
import org.junit.Test;

public class ResourceDescriptorTest {
  @Test
  public void testResourceDescriptor() throws Exception {
    String rJ = "" +
        "{\n" +
        " \"cpuNumber\": 1,\n" +
        " \"memoryMB\": 2,\n" +
        " \"gpuNumber\": 3,\n" +
        " \"portDefinitions\": {\n" +
        "  \"httpPort\": {\n" +
        "   \"start\": 0,\n" +
        "   \"count\": 1\n" +
        "  },\n" +
        "  \"sshPort\": {\n" +
        "   \"start\": 0,\n" +
        "   \"count\": 1\n" +
        "  }\n" +
        " }\n" +
        "}";

    String rY = "" +
        "!!com.microsoft.frameworklauncher.common.model.ResourceDescriptor\n" +
        "cpuNumber: 1\n" +
        "memoryMB: 2\n" +
        "gpuNumber: 3\n" +
        "portDefinitions:\n" +
        "  httpPort: {count: 1, start: 0}\n" +
        "  sshPort: {count: 1, start: 0}\n";

    String rJN = "" +
        "{\n" +
        " \"cpuNumber\": 1,\n" +
        " \"memoryMB\": 2,\n" +
        " \"gpuNumber\": 3,\n" +
        " \"portNumber\": 4\n" +
        "}";

    String rYN = "" +
        "!!com.microsoft.frameworklauncher.common.model.ResourceDescriptor\n" +
        "cpuNumber: 1\n" +
        "memoryMB: 2\n" +
        "gpuNumber: 3\n" +
        "portNumber: 4\n";

    // Ensure Json and Yaml Deserialization calls setter, such as setPortDefinitions.
    ResourceDescriptor rJO = WebCommon.toObject(rJ, ResourceDescriptor.class);
    Assert.assertEquals(rJO.getCpuNumber().intValue(), 1);
    Assert.assertEquals(rJO.getMemoryMB().intValue(), 2);
    Assert.assertEquals(rJO.getGpuNumber().longValue(), 3L);
    Assert.assertEquals(rJO.getPortNumber().intValue(), 2);

    ResourceDescriptor rYO = YamlUtils.toObject(rY.getBytes(), ResourceDescriptor.class);
    Assert.assertTrue(YamlUtils.deepEquals(rJO, rYO));


    // Ensure Json Deserialization excludes StateVariables, such as portRanges and portNumber, but Yaml does not.
    ResourceDescriptor rJNO = WebCommon.toObject(rJN, ResourceDescriptor.class);
    Assert.assertEquals(rJNO.getPortNumber().intValue(), 0);

    ResourceDescriptor rYNO = YamlUtils.toObject(rYN.getBytes(), ResourceDescriptor.class);
    Assert.assertEquals(rYNO.getPortNumber().intValue(), 4);


    // Ensure Json Serialization excludes StateVariables, such as portRanges and portNumber, but Yaml does not.
    String rOJ = WebCommon.toJson(rJO);
    Assert.assertFalse(rOJ.contains("portRanges"));
    Assert.assertFalse(rOJ.contains("portNumber"));

    String rOY = new String(YamlUtils.toBytes(rJO));
    Assert.assertTrue(rOY.contains("portRanges"));
    Assert.assertTrue(rOY.contains("portNumber"));
  }
}

