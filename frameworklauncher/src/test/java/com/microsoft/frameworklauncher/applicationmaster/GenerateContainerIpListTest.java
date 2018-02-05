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

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.exit.ExitStatusKey;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.StopStatus;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.hdfsstore.HdfsStore;
import com.microsoft.frameworklauncher.hdfsstore.MockHdfsStore;
import com.microsoft.frameworklauncher.testutils.FeatureTestUtils;
import com.microsoft.frameworklauncher.zookeeperstore.MockZookeeperStore;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.records.ContainerId;
import org.apache.hadoop.yarn.api.records.Resource;
import org.apache.hadoop.yarn.util.ConverterUtils;
import org.junit.Assert;
import org.junit.Test;

import java.io.File;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class GenerateContainerIpListTest {
  private static final DefaultLogger LOG = new DefaultLogger(GenerateContainerIpListTest.class);

  private String frameworkName = "TestGenerateContainerIpList";
  private String taskRoleName;
  private int taskNum;

  private MockResourceManager mockResourceManager;
  private ZookeeperStore zkStore;
  private HdfsStore hdfsStore;

  private int exitStatus;

  @Test
  public void testGenerateContainerIpList() throws Exception {
    LOG.logInfo("GenerateContainerIpListTest start!");
    init();

    CountDownLatch signal = new CountDownLatch(1);
    ApplicationMaster am = new AMForTest(signal);
    Thread amThread = new Thread(() -> {
      try {
        am.start();
      } catch (Exception e) {
        am.handleException(e);
      }
    });

    amThread.start();
    amThread.join();

    // Clean up local file
    new File(GlobalConstants.CONTAINER_IP_LIST_FILE).deleteOnExit();

    AggregatedTaskRoleStatus aggregatedTaskRoleStatus =
        zkStore.getAggregatedTaskRoleStatus(frameworkName, taskRoleName);
    List<TaskStatus> taskStatusArray = aggregatedTaskRoleStatus.getTaskStatuses().getTaskStatusArray();

    int completedTaskNum = 0;
    for (TaskStatus taskStatus : taskStatusArray) {
      if (taskStatus.getContainerExitCode() != null) {
        Assert.assertTrue(taskStatus.getTaskState() == TaskState.TASK_COMPLETED);
        completedTaskNum++;
      } else {
        Assert.assertTrue(taskStatus.getTaskState() != TaskState.TASK_COMPLETED);
      }
    }
    Assert.assertTrue(completedTaskNum != 0);

    Assert.assertTrue("ApplicationMaster didn't stop",
        signal.getCount() == 0);
    Assert.assertTrue(String.format("Wrong exitCode : %s", exitStatus),
        exitStatus == ExitStatusKey.CONTAINER_START_FAILED.toInt());

    String containerIpListFilePath =
        hdfsStore.getHdfsStruct().getContainerIpListFilePath(frameworkName);
    File containerIpListFile = new File(containerIpListFilePath);
    Assert.assertTrue(containerIpListFile.exists());

    String content = CommonUtils.readFile(containerIpListFilePath);
    StringTokenizer tokenizer = new StringTokenizer(content, "\n");
    int i = taskNum;
    while (tokenizer.hasMoreTokens()) {
      Assert.assertTrue(i > 0);
      String host = taskStatusArray.get(--i).getContainerIp();
      Assert.assertTrue(host.equals(tokenizer.nextToken()));
    }
  }

  private void init() throws Exception {
    String frameworkFile = Thread.currentThread().getContextClassLoader()
        .getResource("TestGenerateContainerIpList.json").getPath();
    FrameworkRequest frameworkRequest = FeatureTestUtils
        .getFrameworkRequestFromJson(frameworkName, frameworkFile,
            GlobalConstants.LOCAL_HOST_NAME, "user");
    FrameworkStatus frameworkStatus = FeatureTestUtils.getFrameworkStatusFromRequest(frameworkRequest);

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

    FeatureTestUtils.setEnvsVariables(frameworkName, frameworkStatus);

    // Initialize zookeeper
    zkStore = MockZookeeperStore.newInstanceWithClean(FeatureTestUtils.ZK_BASE_DIR);
    FeatureTestUtils.initZK(zkStore, frameworkRequest, frameworkStatus);

    hdfsStore = new MockHdfsStore(FeatureTestUtils.HDFS_BASE_DIR);

    mockResourceManager = MockResourceManager.newInstance(taskNum,
        Resource.newInstance(4, 4));
  }


  private class AMForTest extends MockApplicationMaster {
    private final DefaultLogger LOGGER = new DefaultLogger(AMForTest.class);
    private CountDownLatch signal;

    public AMForTest(CountDownLatch signal) {
      this.signal = signal;
    }

    @Override
    protected void initialize() throws Exception {
      super.initialize();

      rmClient = new MockAMRMClient<>(FeatureTestUtils.newApplicationAttemptId(),
          mockResourceManager, 60 * 1000,
          new RMClientCallbackHandler(this));

      yarnClient = new MockYarnClient(mockResourceManager);
    }

    @Override
    protected void run() throws Exception {
      super.run();
      sendErrorMessage();

      signal.await(20, TimeUnit.SECONDS);
    }

    @Override
    public synchronized void stop(StopStatus stopStatus) {
      // Best Effort to stop Gracefully
      AggregateException ae = new AggregateException();

      try {
        if (statusManager != null) {
          statusManager.stop(stopStatus);
        }
      } catch (Exception e) {
        ae.addException(e);
      }

      try {
        if (requestManager != null) {
          requestManager.stop(stopStatus);
        }
      } catch (Exception e) {
        ae.addException(e);
      }

      if (ae.getExceptions().size() > 0) {
        LOGGER.logWarning(ae, "Failed to stop %s gracefully", serviceName);
      }

      LOGGER.logInfo("%s stopped", serviceName);
      exitStatus = stopStatus.getCode();
      signal.countDown();
    }

    private void sendErrorMessage() throws InterruptedException {
      List<TaskState> stateList = Arrays.asList(
          TaskState.CONTAINER_ALLOCATED, TaskState.CONTAINER_LAUNCHED, TaskState.CONTAINER_RUNNING);
      List<TaskStatus> list = statusManager.getTaskStatus(new HashSet<>(stateList));
      while (list.size() < taskNum) {
        Thread.sleep(2000);
        list = statusManager.getTaskStatus(new HashSet<>(stateList));
      }

      String containerIdStr = list.get(0).getContainerId();
      ContainerId containerId = ConverterUtils.toContainerId(containerIdStr);
      onStartContainerError(containerId, new Exception());
    }
  }
}