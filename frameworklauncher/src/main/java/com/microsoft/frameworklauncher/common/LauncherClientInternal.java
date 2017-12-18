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

package com.microsoft.frameworklauncher.common;

import com.microsoft.frameworklauncher.common.exceptions.LauncherClientException;
import com.microsoft.frameworklauncher.common.model.*;
import org.apache.http.HttpStatus;
import org.apache.http.entity.ContentType;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.function.Predicate;

/**
 * Internal implementation of LauncherClient.
 * It is for internal use only, external User should not use it.
 */
public class LauncherClientInternal {
  private final WebClient webClient;
  private final int maxRetryCount;
  private final int retryIntervalSec;

  public LauncherClientInternal(String launcherAddress, int maxRetryCount, int retryIntervalSec, LaunchClientType launchClientType) {
    this.webClient = new WebClient(launcherAddress, launchClientType.toString());
    this.maxRetryCount = maxRetryCount;
    this.retryIntervalSec = retryIntervalSec;
  }

  public RequestedFrameworkNames getFrameworks() throws Exception {
    return getFrameworks(null);
  }

  public RequestedFrameworkNames getFrameworks(LaunchClientType launchClientType) throws Exception {
    return executeWithRetry(() -> {
      Map<String, String> parameters = null;
      if (launchClientType != null) {
        parameters = new HashMap<>();
        parameters.put(WebCommon.LAUNCH_CLIENT_TYPE_REQUEST_HEADER, launchClientType.toString());
      }
      return webClient.get(WebStructure.FRAMEWORK_ROOT_PATH, parameters);
    }, RequestedFrameworkNames.class);
  }

  public void putFramework(String frameworkName, String frameworkDescriptor) throws Exception {
    putFramework(frameworkName, WebCommon.toObject(frameworkDescriptor, FrameworkDescriptor.class));
  }

  public void putFramework(String frameworkName, FrameworkDescriptor frameworkDescriptor) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(frameworkName);
      ModelValidation.validate(frameworkDescriptor);
      return webClient.put(
          WebStructure.getFrameworkPath(frameworkName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(frameworkDescriptor));
    });
  }

  public void putTaskNumber(String frameworkName, String taskRoleName, UpdateTaskNumberRequest updateTaskNumberRequest) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(frameworkName);
      ModelValidation.validate(taskRoleName);
      ModelValidation.validate(updateTaskNumberRequest);
      return webClient.put(
          WebStructure.getTaskNumberPath(frameworkName, taskRoleName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(updateTaskNumberRequest));
    });
  }

  public void putMigrateTask(String frameworkName, String containerId, MigrateTaskRequest migrateTaskRequest) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(frameworkName);
      ModelValidation.validate(migrateTaskRequest);
      return webClient.put(
          WebStructure.getMigrateTaskPath(frameworkName, containerId),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(migrateTaskRequest));
    });
  }

  public void putApplicationProgress(String frameworkName, OverrideApplicationProgressRequest overrideApplicationProgressRequest) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(frameworkName);
      ModelValidation.validate(overrideApplicationProgressRequest);
      return webClient.put(
          WebStructure.getApplicationProgressPath(frameworkName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(overrideApplicationProgressRequest));
    });
  }

  public void deleteFramework(String frameworkName) throws Exception {
    executeWithRetry(() -> {
      return webClient.delete(WebStructure.getFrameworkPath(frameworkName));
    });
  }

  public void deleteMigrateTask(String frameworkName, String containerId) throws Exception {
    executeWithRetry(() -> webClient.delete(WebStructure.getMigrateTaskPath(frameworkName, containerId)));
  }

  public AggregatedFrameworkStatus getAggregatedFrameworkStatus(String frameworkName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getAggregatedFrameworkStatusPath(frameworkName));
    }, AggregatedFrameworkStatus.class, (output) -> {
      return shouldRetryGetStatus(output, frameworkName);
    });
  }

  public FrameworkStatus getFrameworkStatus(String frameworkName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getFrameworkStatusPath(frameworkName));
    }, FrameworkStatus.class, (output) -> {
      return shouldRetryGetStatus(output, frameworkName);
    });
  }

  public TaskRoleStatus getTaskRoleStatus(String frameworkName, String taskRoleName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getTaskRoleStatusPath(frameworkName, taskRoleName));
    }, TaskRoleStatus.class, (output) -> {
      return shouldRetryGetStatus(output, frameworkName);
    });
  }

  public TaskStatuses getTaskStatuses(String frameworkName, String taskRoleName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getTaskStatusesPath(frameworkName, taskRoleName));
    }, TaskStatuses.class, (output) -> {
      return shouldRetryGetStatus(output, frameworkName);
    });
  }

  public AggregatedFrameworkRequest getAggregatedFrameworkRequest(String frameworkName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getAggregatedFrameworkRequestPath(frameworkName));
    }, AggregatedFrameworkRequest.class);
  }

  public FrameworkRequest getFrameworkRequest(String frameworkName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getFrameworkRequestPath(frameworkName));
    }, FrameworkRequest.class);
  }

  public LauncherStatus getLauncherStatus() throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.LAUNCHER_STATUS_PATH);
    }, LauncherStatus.class);
  }

  public LauncherRequest getLauncherRequest() throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.LAUNCHER_REQUEST_PATH);
    }, LauncherRequest.class);
  }

  public void putDataDeploymentVersion(UpdateDataDeploymentVersionRequest updateDataDeploymentVersionRequest) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(updateDataDeploymentVersionRequest);
      return webClient.put(
          WebStructure.DATA_DEPLOYMENT_VERSION_PATH,
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(updateDataDeploymentVersionRequest));
    });
  }

  public void putClusterConfiguration(ClusterConfiguration clusterConfiguration) throws Exception {
    executeWithRetry(() -> {
      ModelValidation.validate(clusterConfiguration);
      return webClient.put(
          WebStructure.CLUSTER_CONFIGURATION_PATH,
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(clusterConfiguration));
    });
  }

  private Boolean shouldRetryCommon(WebClientOutput output) {
    if (output.getStatusCode() == HttpStatus.SC_REQUEST_TIMEOUT ||
        output.getStatusCode() == HttpStatus.SC_SERVICE_UNAVAILABLE ||
        output.getStatusCode() == WebCommon.SC_TOO_MANY_REQUESTS) {
      // Must be Transient Failure
      return true;
    } else if (output.getStatusCode() == HttpStatus.SC_BAD_REQUEST) {
      // Must be NON_TRANSIENT Failure
      return false;
    } else {
      // UNKNOWN Failure
      return null;
    }
  }

  private boolean shouldRetryGetStatus(WebClientOutput output, String frameworkName) {
    if (output.getStatusCode() == HttpStatus.SC_NOT_FOUND) {
      // Specified Framework's Status does not exist.
      // This may due to specified Framework is not Requested or
      // the Framework Requested but the Status has not been initialized by backend.
      // So, the Client is expected to retry for the latter case.
      try {
        getFrameworkRequest(frameworkName);
        return true;
      } catch (Exception e) {
        return false;
      }
    } else {
      // At last, consider all UNKNOWN Failure as NON_TRANSIENT
      return false;
    }
  }

  private void executeWithRetry(Callable<WebClientOutput> action) throws Exception {
    executeWithRetry(action, null);
  }

  private <T> T executeWithRetry(Callable<WebClientOutput> action, Class<T> classRef) throws Exception {
    return executeWithRetry(action, classRef, null);
  }

  private <T> T executeWithRetry(Callable<WebClientOutput> action, Class<T> classRef, Predicate<WebClientOutput> shouldRetrySupplement) throws Exception {
    int retriedCount = 0;

    while (true) {
      String msg = String.format(
          "Retry [%s / %s -> %ss]: Failed Finally, check LauncherClientException for more details.",
          retriedCount, maxRetryCount, retryIntervalSec);

      WebClientOutput output;
      try {
        output = action.call();
      } catch (Exception e) {
        output = new WebClientOutput(HttpStatus.SC_BAD_REQUEST, e.toString(), false, e);
      }

      if (output.isSuccessStatusCode()) {
        if (classRef == null) {
          return null;
        }
        try {
          return WebCommon.toObject(output.getContent(), classRef);
        } catch (Exception e) {
          // This can only happen when Client use an incompatible model with Server
          output = new WebClientOutput(HttpStatus.SC_BAD_REQUEST, output.getContent(), false, e);
        }
      }

      Boolean shouldRetryCommonResult = shouldRetryCommon(output);
      Boolean shouldRetryFinalResult;
      if (shouldRetryCommonResult != null) {
        shouldRetryFinalResult = shouldRetryCommonResult;
      } else {
        if (shouldRetrySupplement != null && shouldRetrySupplement.test(output)) {
          shouldRetryFinalResult = true;
        } else {
          // At last, consider all UNKNOWN Failure as NON_TRANSIENT
          shouldRetryFinalResult = false;
        }
      }

      if (!shouldRetryFinalResult) {
        throw new LauncherClientException(msg, output, false);
      } else if ((maxRetryCount != -1 && retriedCount >= maxRetryCount)) {
        throw new LauncherClientException(msg, output, true);
      } else {
        if (retryIntervalSec > 0) {
          Thread.sleep(retryIntervalSec * 1000);
        }
        retriedCount++;
      }
    }
  }
}
