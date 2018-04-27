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

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.FrameworkRequest;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.zookeeper.KeeperException;

import java.util.Map;


// Manage the CURD to ZK Request
// Note:
//  Public property and interface is considered as underlay Request which
//  does not need to be synchronized with (notified to) Service and it can be changed at any time.
//  So, Service can implicitly support some Requests changed on the fly.
public class RequestManager extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RequestManager.class);

  private final Service service;
  private final LauncherConfiguration conf;
  private final ZookeeperStore zkStore;


  /**
   * REGION BaseRequest
   */
  // Service only need to retrieve AllFrameworkRequests
  // FrameworkName -> FrameworkRequest
  private volatile Map<String, FrameworkRequest> frameworkRequests = null;


  /**
   * REGION AbstractService
   */
  public RequestManager(Service service, LauncherConfiguration conf, ZookeeperStore zkStore) {
    super(RequestManager.class.getName());
    this.service = service;
    this.conf = conf;
    this.zkStore = zkStore;
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    LOGGER.logError(e,
        "Exception occurred in %1$s. %1$s will be stopped.",
        serviceName);

    // Rethrow is not work in another Thread, so using CallBack
    service.onExceptionOccurred(e);
    return false;
  }

  // No need to initialize for RequestManager
  // No need to recover for RequestManager
  // No need to stop ongoing Thread, since zkStore is Atomic
  @Override
  protected void run() throws Exception {
    super.run();

    new Thread(() -> {
      while (true) {
        try {
          pullRequest();

          Thread.sleep(conf.getServiceRequestPullIntervalSec() * 1000);
        } catch (Exception e) {
          // Directly throw TransientException to Service, since it may not be recovered or make progress any more
          handleException(e);
        }
      }
    }).start();
  }

  /**
   * REGION InternalUtils
   */
  private void pullRequest() throws Exception {
    Map<String, FrameworkRequest> newFrameworkRequests;
    try {
      LOGGER.logInfo("Pulling AllFrameworkRequests");

      newFrameworkRequests = zkStore.getAllFrameworkRequests();

      LOGGER.logInfo("Pulled AllFrameworkRequests");
    } catch (KeeperException.NoNodeException e) {
      LOGGER.logWarning(e,
          "Failed to getAllFrameworkRequests, LauncherRequest is deleted on ZK");
      throw e;
    }

    // newFrameworkRequests is always not null
    updateFrameworkRequests(newFrameworkRequests);
  }

  private void updateFrameworkRequests(Map<String, FrameworkRequest> newFrameworkRequests) {
    if (YamlUtils.deepEquals(frameworkRequests, newFrameworkRequests)) {
      return;
    }

    // Backup old to detect changes
    Map<String, FrameworkRequest> oldFrameworkRequests = frameworkRequests;

    // Update
    frameworkRequests = CommonExts.asReadOnly(newFrameworkRequests);

    if (oldFrameworkRequests == null) {
      // For the first time, send all Request to AM
      service.onFrameworkRequestsUpdated(frameworkRequests);
      {
        // Only start them for the first time
        service.onStartRMResyncHandler();
        // Start TransitionFrameworkStateQueue at last, in case some Tasks in the queue
        // depend on the Request or previous AM Notify.
        service.onStartTransitionFrameworkStateQueue();
      }
    } else {
      // For the other times, only send changed Request to AM
      service.onFrameworkRequestsUpdated(frameworkRequests);
    }
  }

  /**
   * REGION ReadInterface
   */
  // Returned FrameworkRequest is readonly, caller should not modify it
  public FrameworkRequest tryGetFrameworkRequest(String frameworkName, Integer frameworkVersion) {
    FrameworkRequest frameworkRequest = frameworkRequests.get(frameworkName);
    if (frameworkRequest == null ||
        !frameworkRequest.getFrameworkDescriptor().getVersion().equals(frameworkVersion)) {
      LOGGER.logWarning(
          "[%s][%s] not found in Request.", frameworkName, frameworkVersion);
      return null;
    } else {
      return frameworkRequest;
    }
  }
}
