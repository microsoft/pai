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

package com.microsoft.frameworklauncher.webserver;

import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exit.ExitStatusKey;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.FrameworkRequest;
import com.microsoft.frameworklauncher.common.model.FrameworkStatus;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.service.StopStatus;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.webapp.WebApps;

import java.util.List;
import java.util.Map;

// Forward Http Request to ZK Request and Return ZK Status.
public class WebServer extends AbstractService {
  private static final DefaultLogger LOGGER = new DefaultLogger(WebServer.class);

  private final LauncherConfiguration conf;

  /**
   * REGION SubServices
   */
  private final ZookeeperStore zkStore;
  private StatusManager statusManager;
  private RequestManager requestManager;

  /**
   * REGION AbstractService
   */
  public WebServer(LauncherConfiguration conf, ZookeeperStore zkStore) {
    super(WebServer.class.getName());
    this.conf = conf;
    this.zkStore = zkStore;
  }

  protected Boolean handleException(Exception e) {
    super.handleException(e);

    if (e instanceof NonTransientException) {
      LOGGER.logError(e,
          "NonTransientException occurred in %1$s. %1$s will be stopped.",
          serviceName);

      stop(new StopStatus(ExitStatusKey.LAUNCHER_INTERNAL_NON_TRANSIENT_ERROR.toInt(), true, null, e));
      return false;
    } else {
      LOGGER.logError(e,
          "Exception occurred in %1$s. It should be transient. Will restart %1$s inplace.",
          serviceName);

      // TODO: Only Restart WebServer instead of exit whole process and Restart by external system.
      stop(new StopStatus(ExitStatusKey.LAUNCHER_INTERNAL_UNKNOWN_ERROR.toInt(), false, null, e));
      return true;
    }
  }

  // No need to initialize for WebServer
  @Override
  protected void recover() throws Exception {
    super.recover();
    requestManager = new RequestManager(this, conf, zkStore);
    requestManager.start();

    // Run StatusManager depends on RequestManager
    statusManager = new StatusManager(this, conf, zkStore);
    statusManager.start();
  }

  @Override
  protected void run() throws Exception {
    super.run();

    // Here both RequestManager and StatusManager recover completed
    String bindAddress = WebCommon.getBindAddress(
        conf.getWebServerBindHost(), conf.getWebServerAddress());
    WebApps.$for("frameworklauncher", null, null, "ws")
        .at(bindAddress)
        .start(new LauncherWebApp(conf, statusManager, requestManager));

    LOGGER.logInfo("WebApp Started at %s", bindAddress);
  }

  // THREAD SAFE
  @Override
  public synchronized void stop(StopStatus stopStatus) {
    // Best Effort to stop Gracefully
    super.stop(stopStatus);

    AggregateException ae = new AggregateException();

    // Stop WebServer's SubServices
    try {
      if (zkStore != null) {
        zkStore.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    if (ae.getExceptions().size() > 0) {
      LOGGER.logWarning(ae, "Failed to stop %s gracefully", serviceName);
    }

    LOGGER.logInfo("%s stopped", serviceName);
    System.exit(stopStatus.getCode());
  }


  /**
   * REGION Callbacks
   */
  // WebServer integrate and process all Callbacks from all its SubServices

  // Callbacks from SubServices
  public void onExceptionOccurred(Exception e) {
    LOGGER.logInfo(e, "onExceptionOccurred");

    // Handle SubService Exception ASAP
    handleException(e);
  }

  public void onCompletedFrameworkStatusesUpdated(
      Map<String, FrameworkStatus> completedFrameworkStatuses)
      throws Exception {
    requestManager.onCompletedFrameworkStatusesUpdated(completedFrameworkStatuses);
  }


  /**
   * REGION ReadInterface
   */
  public List<FrameworkRequest> getAllFrameworkRequests() throws Exception {
    return requestManager.getFrameworkRequests(null, null);
  }
}