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

package com.microsoft.frameworklauncher.service;

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import org.apache.hadoop.yarn.api.records.ApplicationReport;
import org.apache.hadoop.yarn.client.api.YarnClient;

import java.util.*;

public class RMResyncHandler { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RMResyncHandler.class);

  private final Service service;
  private final LauncherConfiguration conf;
  private final YarnClient yarnClient;

  public RMResyncHandler(Service service, LauncherConfiguration conf, YarnClient yarnClient) {
    this.service = service;
    this.conf = conf;
    this.yarnClient = yarnClient;
  }

  public void start() {
    LOGGER.logInfo("Starting RMResyncHandler");

    // The order is important between executing resyncWithRM and other SystemTasks,
    // so resyncWithRM is also need to be queued to execute.
    service.queueResyncWithRM(conf.getServiceRMResyncIntervalSec());

    LOGGER.logInfo("Running RMResyncHandler");
  }

  public void resyncWithRM() throws Exception {
    List<ApplicationReport> reports = null;

    try {
      LOGGER.logDebug("Started to getApplications");

      // Only Get LAUNCHER ApplicationReport
      reports = yarnClient.getApplications(new HashSet<>(
          Collections.singletonList(GlobalConstants.LAUNCHER_APPLICATION_TYPE)));

      LOGGER.logDebug("Succeeded to getApplications");
    } catch (Exception e) {
      LOGGER.logWarning(e,
          "Exception occurred during GetApplications. It should be transient. " +
              "Will retry next time after %ss", conf.getServiceRMResyncIntervalSec());
    }

    if (reports != null) {
      // ApplicationId -> ApplicationReport
      Map<String, ApplicationReport> liveApplicationReports = new HashMap<>();
      for (ApplicationReport report : reports) {
        liveApplicationReports.put(report.getApplicationId().toString(), report);
      }

      service.onLiveApplicationsUpdated(liveApplicationReports);
    }

    service.queueResyncWithRM(conf.getServiceRMResyncIntervalSec());
  }
}