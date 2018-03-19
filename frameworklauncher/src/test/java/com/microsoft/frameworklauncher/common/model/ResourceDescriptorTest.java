package com.microsoft.frameworklauncher.common.model;

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import org.junit.Assert;
import org.junit.Test;


public class ResourceDescriptorTest {
  private static final DefaultLogger LOGGER = new DefaultLogger(ResourceDescriptorTest.class);

  @Test
  public void testResourceDescriptor() throws Exception {

      String resourceDescriptorContent = "{\n" +
                                "          \"cpuNumber\": 1,\n" +
                                "          \"memoryMB\": 2,\n" +
                                "          \"gpuNumber\": 3,\n" +
                                "          \"portDefinitions\": {\n" +
                                "          \t\"httpPort\": {\n" +
                                "          \t\t\"start\": 0,\n" +
                                "          \t\t\"count\": 1\n" +
                                "          \t},\n" +
                                "          \t\"sshPort\": {\n" +
                                "          \t\t\"start\": 0,\n" +
                                "          \t\t\"count\": 1\n" +
                                "          \t}\n" +
                                "          }\n" +
                                "        }";
      ResourceDescriptor resourceDescriptor = WebCommon.toObject(resourceDescriptorContent, ResourceDescriptor.class);

      Assert.assertEquals(resourceDescriptor.getCpuNumber().intValue(), 1);
      Assert.assertEquals(resourceDescriptor.getGpuNumber().longValue(), 3L);
      Assert.assertEquals(resourceDescriptor.getPortNumber().intValue(), 2);

      byte[] resourceDescriptorBytes = YamlUtils.toBytes(resourceDescriptor);
      ResourceDescriptor resourceDescriptor2 = YamlUtils.toObject(resourceDescriptorBytes, ResourceDescriptor.class);
      Assert.assertEquals(resourceDescriptor.getCpuNumber(), resourceDescriptor2.getCpuNumber());
      Assert.assertEquals(resourceDescriptor.getGpuNumber(), resourceDescriptor2.getGpuNumber());
      Assert.assertEquals(resourceDescriptor.getDiskMB(), resourceDescriptor2.getDiskMB());
      Assert.assertEquals(resourceDescriptor.getDiskType(), resourceDescriptor2.getDiskType());
      Assert.assertEquals(resourceDescriptor.getGpuAttribute(), resourceDescriptor2.getGpuAttribute());
      Assert.assertEquals(resourceDescriptor.getMemoryMB(), resourceDescriptor2.getMemoryMB());
      Assert.assertEquals(resourceDescriptor.getPortNumber(), resourceDescriptor2.getPortNumber());
      Assert.assertTrue(ValueRangeUtils.isEqualRangeList(resourceDescriptor.getPortRanges(),resourceDescriptor2.getPortRanges()));
    }
}

