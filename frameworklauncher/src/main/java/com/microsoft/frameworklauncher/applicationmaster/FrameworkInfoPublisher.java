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

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.hdfsstore.HdfsStore;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;

import java.util.Map;

// Publish current running FrameworkInfo to a public HDFS file
// This is used to improve the scalability to fetch current running FrameworkInfo,
// because fetch from a per Framework HDFS FrameworkInfo file is more scalable
// than fetch from a global single instance LauncherWebServer.
public class FrameworkInfoPublisher extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(FrameworkInfoPublisher.class);

  private final ApplicationMaster am;
  private final Configuration conf;
  private final ZookeeperStore zkStore;
  private final HdfsStore hdfsStore;
  private final StatusManager statusManager;
  private final RequestManager requestManager;

  // Latest Published FrameworkInfo
  private FrameworkInfo publishedFrameworkInfo;

  /**
   * REGION AbstractService
   */
  public FrameworkInfoPublisher(
      ApplicationMaster am, Configuration conf,
      ZookeeperStore zkStore, HdfsStore hdfsStore,
      StatusManager statusManager, RequestManager requestManager) {
    super(FrameworkInfoPublisher.class.getName());
    this.am = am;
    this.conf = conf;
    this.zkStore = zkStore;
    this.hdfsStore = hdfsStore;
    this.statusManager = statusManager;
    this.requestManager = requestManager;
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    LOGGER.logError(e,
        "Exception occurred in %1$s. %1$s will be stopped.",
        serviceName);

    // Rethrow is not work in another Thread, so using CallBack
    am.onExceptionOccurred(e);
    return false;
  }

  // No need to initialize for FrameworkInfoPublisher
  // No need to recover for FrameworkInfoPublisher
  // No need to stop ongoing Thread, since hdfsStore.uploadFrameworkInfoFile is Atomic
  @Override
  protected void run() throws Exception {
    super.run();

    new Thread(() -> {
      while (true) {
        try {
          publishFrameworkInfo();

          Thread.sleep(conf.getLauncherConfig().getAmFrameworkInfoPublishIntervalSec() * 1000);
        } catch (Exception e) {
          LOGGER.logWarning(e,
              "Exception occurred during publishFrameworkInfo. It should be transient. " +
                  "Will retry next time after %ss", conf.getLauncherConfig().getAmFrameworkInfoPublishIntervalSec());
        }
      }
    }).start();
  }


  /**
   * REGION InternalUtils
   */
  private void publishFrameworkInfo() throws Exception {
    FrameworkInfo newFrameworkInfo = getFrameworkInfo();
    if (YamlUtils.deepEquals(publishedFrameworkInfo, newFrameworkInfo)) {
      return;
    }

    LOGGER.logInfo("Publishing FrameworkInfo");

    hdfsStore.uploadFrameworkInfoFile(conf.getFrameworkName(), newFrameworkInfo);
    publishedFrameworkInfo = newFrameworkInfo;

    LOGGER.logInfo("Published FrameworkInfo");
  }

  private FrameworkInfo getFrameworkInfo() throws Exception {
    AggregatedFrameworkRequest aggFrameworkRequest = requestManager.getAggregatedFrameworkRequest();
    FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();

    AggregatedFrameworkStatus aggFrameworkStatus = new AggregatedFrameworkStatus();
    FrameworkStatus frameworkStatus = zkStore.getFrameworkStatus(conf.getFrameworkName());
    Map<String, AggregatedTaskRoleStatus> aggTaskRoleStatuses = statusManager.getPersistedAggTaskRoleStatuses();
    aggFrameworkStatus.setFrameworkStatus(frameworkStatus);
    aggFrameworkStatus.setAggregatedTaskRoleStatuses(aggTaskRoleStatuses);

    FrameworkInfo frameworkInfo = new FrameworkInfo();
    frameworkInfo.setSummarizedFrameworkInfo(SummarizedFrameworkInfo.newInstance(frameworkRequest, frameworkStatus));
    frameworkInfo.setAggregatedFrameworkRequest(aggFrameworkRequest);
    frameworkInfo.setAggregatedFrameworkStatus(aggFrameworkStatus);
    return frameworkInfo;
  }
}
