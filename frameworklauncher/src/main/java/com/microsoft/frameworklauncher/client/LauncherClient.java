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

package com.microsoft.frameworklauncher.client;

import com.microsoft.frameworklauncher.common.exceptions.LauncherClientException;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.validation.CommonValidation;
import com.microsoft.frameworklauncher.common.web.WebClient;
import com.microsoft.frameworklauncher.common.web.WebClientOutput;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.common.web.WebStructure;
import org.apache.http.HttpStatus;
import org.apache.http.entity.ContentType;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.function.Predicate;

public class LauncherClient {
  private final WebClient webClient;
  private final int maxRetryCount;
  private final int retryIntervalSec;

  public LauncherClient(String launcherAddress, int maxRetryCount, int retryIntervalSec,
      LaunchClientType launchClientType, String userName) {
    this.webClient = new WebClient(launcherAddress, launchClientType, userName);
    this.maxRetryCount = maxRetryCount;
    this.retryIntervalSec = retryIntervalSec;
  }

  public SummarizedFrameworkInfos getFrameworks() throws Exception {
    return getFrameworks(null, null);
  }

  public SummarizedFrameworkInfos getFrameworks(LaunchClientType launchClientType) throws Exception {
    return getFrameworks(launchClientType, null);
  }

  public SummarizedFrameworkInfos getFrameworks(String userName) throws Exception {
    return getFrameworks(null, userName);
  }

  public SummarizedFrameworkInfos getFrameworks(LaunchClientType launchClientType, String userName) throws Exception {
    return executeWithRetry(() -> {
      Map<String, String> parameters = new HashMap<>();
      if (launchClientType != null) {
        parameters.put(WebStructure.REQUEST_PARAM_LAUNCH_CLIENT_TYPE, launchClientType.toString());
      }
      if (userName != null) {
        CommonValidation.validate(userName);
        parameters.put(WebStructure.REQUEST_PARAM_USER_NAME, userName);
      }
      return webClient.get(WebStructure.FRAMEWORK_ROOT_PATH, parameters);
    }, SummarizedFrameworkInfos.class);
  }

  public void putFramework(String frameworkName, String frameworkDescriptor) throws Exception {
    putFramework(frameworkName, WebCommon.toObject(frameworkDescriptor, FrameworkDescriptor.class));
  }

  public void putFramework(String frameworkName, FrameworkDescriptor frameworkDescriptor) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(frameworkName);
      CommonValidation.validate(frameworkDescriptor);
      return webClient.put(
          WebStructure.getFrameworkPath(frameworkName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(frameworkDescriptor));
    });
  }

  public void putTaskNumber(String frameworkName, String taskRoleName, UpdateTaskNumberRequest updateTaskNumberRequest) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(frameworkName);
      CommonValidation.validate(taskRoleName);
      CommonValidation.validate(updateTaskNumberRequest);
      return webClient.put(
          WebStructure.getTaskNumberPath(frameworkName, taskRoleName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(updateTaskNumberRequest));
    });
  }

  public void putExecutionType(String frameworkName, UpdateExecutionTypeRequest updateExecutionTypeRequest) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(frameworkName);
      CommonValidation.validate(updateExecutionTypeRequest);
      return webClient.put(
          WebStructure.getExecutionTypePath(frameworkName),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(updateExecutionTypeRequest));
    });
  }

  public void putMigrateTask(String frameworkName, String containerId, MigrateTaskRequest migrateTaskRequest) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(frameworkName);
      CommonValidation.validate(migrateTaskRequest);
      return webClient.put(
          WebStructure.getMigrateTaskPath(frameworkName, containerId),
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(migrateTaskRequest));
    });
  }

  public void putApplicationProgress(String frameworkName, OverrideApplicationProgressRequest overrideApplicationProgressRequest) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(frameworkName);
      CommonValidation.validate(overrideApplicationProgressRequest);
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
    }, AggregatedFrameworkStatus.class);
  }

  public FrameworkStatus getFrameworkStatus(String frameworkName) throws Exception {
    return executeWithRetry(() -> {
      return webClient.get(WebStructure.getFrameworkStatusPath(frameworkName));
    }, FrameworkStatus.class);
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
      CommonValidation.validate(updateDataDeploymentVersionRequest);
      return webClient.put(
          WebStructure.DATA_DEPLOYMENT_VERSION_PATH,
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(updateDataDeploymentVersionRequest));
    });
  }

  public void putClusterConfiguration(ClusterConfiguration clusterConfiguration) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(clusterConfiguration);
      return webClient.put(
          WebStructure.CLUSTER_CONFIGURATION_PATH,
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(clusterConfiguration));
    });
  }

  public void putAclConfiguration(AclConfiguration aclConfiguration) throws Exception {
    executeWithRetry(() -> {
      CommonValidation.validate(aclConfiguration);
      return webClient.put(
          WebStructure.ACL_CONFIGURATION_PATH,
          ContentType.APPLICATION_JSON,
          WebCommon.toJson(aclConfiguration));
    });
  }

  private Boolean shouldRetryCommon(WebClientOutput output) {
    if (output.getStatusCode() == HttpStatus.SC_REQUEST_TIMEOUT ||
        output.getStatusCode() == HttpStatus.SC_SERVICE_UNAVAILABLE ||
        output.getStatusCode() == WebCommon.SC_TOO_MANY_REQUESTS) {
      // Must be Transient Failure
      return true;
    } else if (output.getStatusCode() == HttpStatus.SC_BAD_REQUEST ||
        output.getStatusCode() == HttpStatus.SC_NOT_FOUND) {
      // Must be NON_TRANSIENT Failure
      return false;
    } else {
      // UNKNOWN Failure
      return null;
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
