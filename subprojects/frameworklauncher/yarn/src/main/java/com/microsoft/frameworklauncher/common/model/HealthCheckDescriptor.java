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

package com.microsoft.frameworklauncher.common.model;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

public class HealthCheckDescriptor implements Serializable {
  @Valid
  @NotNull
  private HealthCheckType healthCheckType = HealthCheckType.COMMAND;

  @Valid
  // Command line
  // The executable inside the command line must be a system executable (like ping.exe) or
  // it is an executable inside the ServiceDescriptor.SourceLocations.
  private String entryPoint;

  @Valid
  private String webUrl;

  @Valid
  @NotNull
  // It is the amount of time to wait until starting health checking
  private Integer delaySeconds = 30;

  @Valid
  @NotNull
  // It is the interval between health checks
  private Integer intervalSeconds = 30;

  @Valid
  @NotNull
  // It is the amount of time to wait for the health check to complete.
  // After this timeout, the health check is aborted and treated as a failure.
  private Integer timeoutSeconds = 30;

  @Valid
  @NotNull
  // It is the number of consecutive failures until the user application is killed by the agent
  private Integer consecutiveFailures = 10;

  @Valid
  @NotNull
  // It is the amount of time after the user application is launched during which health check failures are ignored.
  // Once a health check succeeds for the first time, the grace period does not apply anymore.
  // Note that it includes "delaySeconds", i.e., setting "gracePeriodSeconds" < "delaySeconds" has no effect.
  private Integer gracePeriodSeconds = 60;

  @Valid
  @NotNull
  // It is the agent exit type in encountering health check failure
  private HealthCheckFailureType healthCheckFailureType = HealthCheckFailureType.TRANSIENT_ERROR;

  public HealthCheckType getHealthCheckType() {
    return healthCheckType;
  }

  public void setHealthCheckType(HealthCheckType healthCheckType) {
    this.healthCheckType = healthCheckType;
  }

  public String getEntryPoint() {
    return entryPoint;
  }

  public void setEntryPoint(String entryPoint) {
    this.entryPoint = entryPoint;
  }

  public String getWebUrl() {
    return webUrl;
  }

  public void setWebUrl(String webUrl) {
    this.webUrl = webUrl;
  }

  public Integer getDelaySeconds() {
    return delaySeconds;
  }

  public void setDelaySeconds(Integer delaySeconds) {
    this.delaySeconds = delaySeconds;
  }

  public Integer getIntervalSeconds() {
    return intervalSeconds;
  }

  public void setIntervalSeconds(Integer intervalSeconds) {
    this.intervalSeconds = intervalSeconds;
  }

  public Integer getTimeoutSeconds() {
    return timeoutSeconds;
  }

  public void setTimeoutSeconds(Integer timeoutSeconds) {
    this.timeoutSeconds = timeoutSeconds;
  }

  public Integer getConsecutiveFailures() {
    return consecutiveFailures;
  }

  public void setConsecutiveFailures(Integer consecutiveFailures) {
    this.consecutiveFailures = consecutiveFailures;
  }

  public Integer getGracePeriodSeconds() {
    return gracePeriodSeconds;
  }

  public void setGracePeriodSeconds(Integer gracePeriodSeconds) {
    this.gracePeriodSeconds = gracePeriodSeconds;
  }

  public HealthCheckFailureType getHealthCheckFailureType() {
    return healthCheckFailureType;
  }

  public void setHealthCheckFailureType(HealthCheckFailureType healthCheckFailureType) {
    this.healthCheckFailureType = healthCheckFailureType;
  }
}
