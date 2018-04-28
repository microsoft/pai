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

package com.microsoft.frameworklauncher.testutils;

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.zookeeperstore.MockZooKeeperClient;
import com.microsoft.frameworklauncher.zookeeperstore.ZooKeeperClient;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStoreStructure;
import org.apache.commons.io.FilenameUtils;
import org.apache.hadoop.yarn.api.ApplicationConstants;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.util.ConverterUtils;

import java.io.File;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class FeatureTestUtils {
  public static final String ZK_BASE_DIR =
      TestUtils.RESOURCE_ROOT + File.separator + "zkDir";
  public static final String HDFS_BASE_DIR =
      TestUtils.RESOURCE_ROOT + File.separator + "hdfsDir";

  static {
    new File(ZK_BASE_DIR).mkdir();
    new File(HDFS_BASE_DIR).mkdir();
  }

  public static void setEnvsVariables(
      String frameworkName, FrameworkStatus frameworkStatus)
      throws Exception {
    LauncherConfiguration config = new LauncherConfiguration();
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();

    // SetupLocalEnvironment
    Map<String, String> localEnvs = new HashMap<>();
    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_NAME, frameworkName);
    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_VERSION, frameworkVersion.toString());

    localEnvs.put(GlobalConstants.ENV_VAR_ZK_CONNECT_STRING, config.getZkConnectString());
    localEnvs.put(GlobalConstants.ENV_VAR_ZK_ROOT_DIR, config.getZkRootDir());
    localEnvs.put(GlobalConstants.ENV_VAR_AM_VERSION, config.getAmVersion().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC, config.getAmRmHeartbeatIntervalSec().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_CONTAINER_ID, "container_" + System.currentTimeMillis() + "_0001_000001_1");

    // For now setting all required classpaths including
    // the classpath to "." for the application jar
    StringBuilder classPathEnv = new StringBuilder(ApplicationConstants.Environment.CLASSPATH.$$())
        .append(ApplicationConstants.CLASS_PATH_SEPARATOR).append("./*");
    localEnvs.put("CLASSPATH", classPathEnv.toString());

    Map<String, String> envMap = System.getenv();
    Field f;
    try {
      f = Class.forName("java.lang.ProcessEnvironment").
          getDeclaredField("theCaseInsensitiveEnvironment");
    } catch (NoSuchFieldException e) {
      f = envMap.getClass().getDeclaredField("m");
    }
    f.setAccessible(true);
    Map<String, String> map = (Map<String, String>) f.get(envMap);
    map.putAll(localEnvs);
  }

  public static void initZK(ZookeeperStore zkStore, FrameworkRequest frameworkRequest, FrameworkStatus frameworkStatus)
      throws Exception {
    initZK(zkStore);

    String frameworkName = frameworkRequest.getFrameworkName();
    zkStore.setFrameworkStatus(frameworkName, frameworkStatus);
    zkStore.setFrameworkRequest(frameworkName, frameworkRequest);
  }

  public static void initZK(ZookeeperStore zkStore)
      throws Exception {
    LauncherConfiguration launcherConfiguration = new LauncherConfiguration();
    launcherConfiguration.setHdfsRootDir(HDFS_BASE_DIR);
    launcherConfiguration.setAmStatusPushIntervalSec(10);

    LauncherStatus launcherStatus = new LauncherStatus();
    launcherStatus.setLauncherConfiguration(launcherConfiguration);

    zkStore.setLauncherStatus(launcherStatus);
    zkStore.setLauncherRequest(new LauncherRequest());
  }

  public static void initContainerList(List<Container> containerList, int length, Resource resource) {
    for (int i = 0; i < length; i++) {
      String containerIdStr = "container_" + System.currentTimeMillis() + "_0001_000001_" + (i + 2);
      ContainerId containerId = ConverterUtils.toContainerId(containerIdStr);
      NodeId nodeId = NodeId.newInstance(GlobalConstants.LOCAL_HOST_NAME, 3215);
      Container container = Container.newInstance(containerId,
          nodeId, GlobalConstants.LOCAL_HOST_NAME, resource, Priority.newInstance(1), null);
      containerList.add(container);
    }
  }

  public static void waitForTaskStatusesPathCreate(String frameworkName, String taskRoleName)
      throws Exception {
    ZooKeeperClient zkClient = new MockZooKeeperClient();
    ZookeeperStoreStructure zkStruct = new ZookeeperStoreStructure(FeatureTestUtils.ZK_BASE_DIR);
    while (!zkClient.exists(zkStruct.getTaskStatusesPath(frameworkName, taskRoleName))) {
      Thread.sleep(2000);
    }
  }

  public static FrameworkStatus getFrameworkStatusFromRequest(FrameworkRequest frameworkRequest) {
    return FrameworkStatus.newInstance(frameworkRequest);
  }

  public static FrameworkRequest getFrameworkRequestFromJson(
      String frameworkName, String descriptionFile, String hostName, String user)
      throws Exception {

    String descriptionContent = CommonUtils.readFile(descriptionFile);
    String descriptionFileExtension = FilenameUtils.getExtension(descriptionFile).toLowerCase();
    if (!descriptionFileExtension.equals("json")) {
      throw new Exception("Unsupported FrameworkDescriptionFile Type: " + descriptionFileExtension);
    }

    FrameworkRequest frameworkRequest = new FrameworkRequest();
    frameworkRequest.setFrameworkName(frameworkName);
    frameworkRequest.setFrameworkDescriptor(WebCommon.toObject(descriptionContent, FrameworkDescriptor.class));
    frameworkRequest.setLaunchClientHostName(hostName);
    frameworkRequest.setLaunchClientUserName(user);

    return frameworkRequest;
  }

  public static ApplicationAttemptId newApplicationAttemptId() {
    Random r = new Random();
    ApplicationId appId = ApplicationId.newInstance(
        System.currentTimeMillis(), r.nextInt(10000));
    return ApplicationAttemptId.newInstance(appId, r.nextInt(10));
  }

}
