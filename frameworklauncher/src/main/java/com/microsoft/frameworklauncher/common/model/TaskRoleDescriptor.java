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
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

public class TaskRoleDescriptor implements Serializable {
  @Valid
  @NotNull
  @Min(0)
  @Max(50000)
  private Integer taskNumber;

  @Valid
  @NotNull
  private Integer scaleUnitNumber = 1;

  @Valid
  @NotNull
  private Integer scaleUnitTimeoutSec = 0;

  @Valid
  @NotNull
  private RetryPolicyDescriptor taskRetryPolicy = new RetryPolicyDescriptor();

  @Valid
  @NotNull
  private ServiceDescriptor taskService;

  @Valid
  @NotNull
  private TaskRolePlatformSpecificParametersDescriptor platformSpecificParameters = new TaskRolePlatformSpecificParametersDescriptor();

  @Valid
  @NotNull
  // If this feature enabled, ApplicationMaster will allocate the same ports for all tasks in a task role
  private Boolean useTheSamePorts = true;

  // private List<ServiceDescriptor> taskServices;
  // private List<String> dependOnTaskRoles;

  public Integer getTaskNumber() {
    return taskNumber;
  }

  public void setTaskNumber(Integer taskNumber) {
    this.taskNumber = taskNumber;
  }

  public Integer getScaleUnitNumber() {
    return scaleUnitNumber;
  }

  public void setScaleUnitNumber(Integer scaleUnitNumber) {
    this.scaleUnitNumber = scaleUnitNumber;
  }

  public Integer getScaleUnitTimeoutSec() {
    return scaleUnitTimeoutSec;
  }

  public void setScaleUnitTimeoutSec(Integer scaleUnitTimeoutSec) {
    this.scaleUnitTimeoutSec = scaleUnitTimeoutSec;
  }

  public RetryPolicyDescriptor getTaskRetryPolicy() {
    return taskRetryPolicy;
  }

  public void setTaskRetryPolicy(RetryPolicyDescriptor taskRetryPolicy) {
    this.taskRetryPolicy = taskRetryPolicy;
  }

  public ServiceDescriptor getTaskService() {
    return taskService;
  }

  public void setTaskService(ServiceDescriptor taskService) {
    this.taskService = taskService;
  }

  public TaskRolePlatformSpecificParametersDescriptor getPlatformSpecificParameters() {
    return platformSpecificParameters;
  }

  public void setPlatformSpecificParameters(TaskRolePlatformSpecificParametersDescriptor platformSpecificParameters) {
    this.platformSpecificParameters = platformSpecificParameters;
  }

  public Boolean getUseTheSamePorts() {
    return useTheSamePorts;
  }

  public void setUseTheSamePorts(Boolean useTheSamePorts) {
    this.useTheSamePorts = useTheSamePorts;
  }
}
