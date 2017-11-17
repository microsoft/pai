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

import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.utils.DefaultLogger;
import com.microsoft.frameworklauncher.utils.DnsClient;
import com.microsoft.frameworklauncher.utils.FeatureTestUtils;
import com.microsoft.frameworklauncher.utils.GlobalConstants;
import com.microsoft.frameworklauncher.zookeeperstore.MockZookeeperStore;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.records.Resource;
import org.junit.Assert;
import org.junit.Test;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class AntiaffinityAllocationTest {
  private static final DefaultLogger LOG = new DefaultLogger(AntiaffinityAllocationTest.class);

  private String frameworkName = "TestAntiaffinityAllocation";
  private String taskRoleName;
  private int taskNum;

  private MockResourceManager mockResourceManager;
  private ZookeeperStore zkStore;

  @Test
  public void testAntiaffinityAllocation() throws Exception {
    LOG.logInfo("AntiaffinityAllocationTest start!");
    init();

    ApplicationMaster am = new AMForTest();
    Thread amThread = new Thread(new Runnable() {
      @Override
      public void run() {
        try {
          am.start();
        } catch (Exception e) {
          am.handleException(e);
        }
      }
    });

    amThread.start();
    amThread.join();

    LOG.logInfo("Wait for status updating");
    FeatureTestUtils.waitForTaskStatusesPathCreate(frameworkName, taskRoleName);

    Thread.sleep(2000);
    AggregatedTaskRoleStatus aggregatedTaskRoleStatus = zkStore.getAggregatedTaskRoleStatus(frameworkName, taskRoleName);
    List<TaskStatus> taskStatusArray = aggregatedTaskRoleStatus.getTaskStatuses().getTaskStatusArray();
    Set<String> hostSet = new HashSet<>();
    for (TaskStatus taskStatus : taskStatusArray) {
      hostSet.add(DnsClient.resolveExternalIPv4Address(taskStatus.getContainerIp()));
    }
    Assert.assertTrue(hostSet.size() == taskStatusArray.size());
  }

  private void init() throws Exception {
    String frameworkFile = Thread.currentThread().getContextClassLoader()
        .getResource("TestAntiaffinityAllocation.json").getPath().toString();
    FrameworkRequest frameworkRequest = FeatureTestUtils
        .getFrameworkRequestFromJson(frameworkName, frameworkFile,
            GlobalConstants.LOCAL_HOST_NAME, "user");

    Map<String, TaskRoleDescriptor> taskRoleDescriptorMap =
        frameworkRequest.getFrameworkDescriptor().getTaskRoles();
    for (Map.Entry<String, TaskRoleDescriptor> entry : taskRoleDescriptorMap.entrySet()) {
      taskRoleName = entry.getKey();

      TaskRoleDescriptor taskRoleDescriptor = entry.getValue();
      taskNum = taskRoleDescriptor.getTaskNumber();

      List<String> sourceLocations = taskRoleDescriptor.getTaskService().getSourceLocations();
      String sourceLocation = FeatureTestUtils.HDFS_BASE_DIR + "/" + getClass().getSimpleName();
      new File(sourceLocation).mkdir();
      sourceLocations.add(sourceLocation);
    }

    FrameworkStatus frameworkStatus = FeatureTestUtils.getFrameworkStatusFromRequest(frameworkRequest);
    FeatureTestUtils.setEnvsVariables(frameworkName, frameworkStatus);

    mockResourceManager = MockResourceManager.newInstance(taskNum + 2,
        Resource.newInstance(4, 4));

    // Initialize zookeeper
    zkStore = MockZookeeperStore.newInstanceWithClean(FeatureTestUtils.ZK_BASE_DIR);
    FeatureTestUtils.initZK(zkStore, frameworkRequest, frameworkStatus);
  }

  private class AMForTest extends MockApplicationMaster {

    @Override
    protected void initialize() throws Exception {
      super.initialize();

      rmClient = new MockAMRMClient(FeatureTestUtils.newApplicationAttemptId(),
          mockResourceManager, 60 * 1000,
          new RMClientCallbackHandler(this));

      yarnClient = new MockYarnClient(mockResourceManager);

      aaAllocationManager = new AntiaffinityAllocationManager();
    }
  }

}