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
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import org.apache.hadoop.yarn.conf.YarnConfiguration;

import java.util.Set;

public class RMResyncHandler { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RMResyncHandler.class);

  private final ApplicationMaster am;
  private final Configuration conf;

  // NM expiry interval buffer
  private static final int NM_EXPIRY_INTERVAL_BUFFER_SECONDS = 600;

  // RMResync interval
  private final int intervalSeconds;

  public RMResyncHandler(ApplicationMaster am, Configuration conf) {
    this.am = am;
    this.conf = conf;

    // Using the NMExpiryInterval from RM configuration which can ensure AM and RM has the same behaviour to
    // to expire the NM container when ContainerConnectionMaxLostCount = RMResyncFrequency.
    int nmExpiryIntervalSeconds =
        conf.getYarnConfig().getInt(YarnConfiguration.RM_NM_EXPIRY_INTERVAL_MS,
            YarnConfiguration.DEFAULT_RM_NM_EXPIRY_INTERVAL_MS) / 1000;

    // During the RM Starting/Down time, the liveContainerIds is incomplete since RM has not fully
    // synced with all NMs to enter a stable RM stage.
    // To make our decisions more reliable, we have to check liveContainerIds at least RMResyncFrequency
    // times before make decisions.
    intervalSeconds =
        (nmExpiryIntervalSeconds + NM_EXPIRY_INTERVAL_BUFFER_SECONDS) /
            this.conf.getLauncherConfig().getAmRmResyncFrequency();
  }

  public void start() {
    LOGGER.logInfo("Starting RMResyncHandler");

    // The order is important between executing resyncWithRM and other SystemTasks,
    // so resyncWithRM is also need to be queued to execute.
    // And do not use Timer, otherwise after RM Down for a long time, multiple getLiveContainerIdsFromRM
    // call will return at the same time with the same incomplete liveContainerIds.
    am.queueResyncWithRM(intervalSeconds);

    LOGGER.logInfo("Running RMResyncHandler");
  }

  public void resyncWithRM() throws Exception {
    Set<String> liveContainerIds = null;

    try {
      LOGGER.logDebug("Started to getLiveContainerIdsFromRM");

      liveContainerIds = HadoopUtils.getLiveContainerIdsFromRM(conf.getAttemptId(), conf.getAmContainerId());

      LOGGER.logDebug("Succeeded to getLiveContainerIdsFromRM");
    } catch (Exception e) {
      LOGGER.logWarning(e,
          "Exception occurred during getLiveContainerIdsFromRM. It should be transient. " +
              "Will retry next time after %ss", intervalSeconds);
    }

    am.onLiveContainersUpdated(liveContainerIds);
    am.queueResyncWithRM(intervalSeconds);
  }
}