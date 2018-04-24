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

import java.io.Serializable;

public class TaskStatus implements Serializable {
  // Task static status
  // taskIndex is the index of this TaskStatus object in TaskStatuses.TaskStatusArray
  // Note taskIndex will not change after Task Restart, Migrated or Upgraded.
  private Integer taskIndex;
  private String taskRoleName;

  // Task dynamic status
  private TaskState taskState = TaskState.TASK_WAITING;
  private RetryPolicyState taskRetryPolicyState;
  private Long taskCreatedTimestamp;
  private Long taskCompletedTimestamp;
  private ServiceStatus taskServiceStatus;

  // Task's current associated Container status which should not change across attempts
  // Note other status can be retrieved from RM
  private String containerId;
  // containerHost is hostname of the node on which the container runs.
  private String containerHost;
  // containerIp is the assigned ipv4 address of the corresponding containerHost
  private String containerIp;
  // containerPorts is a string contains ports for each port label, such as "httpPort:80,81,82;sshPort:1021,1022,1023;"
  private String containerPorts;
  // containerGpus is the assigned GpuAttribute of the container
  private Long containerGpus;
  private String containerLogHttpAddress;
  private Integer containerConnectionLostCount;
  private Boolean containerIsDecommissioning;
  private Long containerLaunchedTimestamp;
  private Long containerCompletedTimestamp;
  private Integer containerExitCode;
  private String containerExitDiagnostics;
  private ExitType containerExitType;

  public Integer getTaskIndex() {
    return taskIndex;
  }

  public void setTaskIndex(Integer taskIndex) {
    this.taskIndex = taskIndex;
  }

  public String getTaskRoleName() {
    return taskRoleName;
  }

  public void setTaskRoleName(String taskRoleName) {
    this.taskRoleName = taskRoleName;
  }

  public TaskState getTaskState() {
    return taskState;
  }

  public void setTaskState(TaskState taskState) {
    this.taskState = taskState;
  }

  public RetryPolicyState getTaskRetryPolicyState() {
    return taskRetryPolicyState;
  }

  public void setTaskRetryPolicyState(RetryPolicyState taskRetryPolicyState) {
    this.taskRetryPolicyState = taskRetryPolicyState;
  }

  public Long getTaskCreatedTimestamp() {
    return taskCreatedTimestamp;
  }

  public void setTaskCreatedTimestamp(Long taskCreatedTimestamp) {
    this.taskCreatedTimestamp = taskCreatedTimestamp;
  }

  public Long getTaskCompletedTimestamp() {
    return taskCompletedTimestamp;
  }

  public void setTaskCompletedTimestamp(Long taskCompletedTimestamp) {
    this.taskCompletedTimestamp = taskCompletedTimestamp;
  }

  public ServiceStatus getTaskServiceStatus() {
    return taskServiceStatus;
  }

  public void setTaskServiceStatus(ServiceStatus taskServiceStatus) {
    this.taskServiceStatus = taskServiceStatus;
  }

  public String getContainerId() {
    return containerId;
  }

  public void setContainerId(String containerId) {
    this.containerId = containerId;
  }

  public String getContainerHost() {
    return containerHost;
  }

  public void setContainerHost(String containerHost) {
    this.containerHost = containerHost;
  }

  public String getContainerIp() {
    return containerIp;
  }

  public void setContainerIp(String containerIp) {
    this.containerIp = containerIp;
  }

  public String getContainerPorts() {
    return containerPorts;
  }

  public void setContainerPorts(String containerPorts) {
    this.containerPorts = containerPorts;
  }

  public Long getContainerGpus() {
    return containerGpus;
  }

  public void setContainerGpus(Long gpus) {
    containerGpus = gpus;
  }

  public String getContainerLogHttpAddress() {
    return containerLogHttpAddress;
  }

  public void setContainerLogHttpAddress(String containerLogHttpAddress) {
    this.containerLogHttpAddress = containerLogHttpAddress;
  }

  public Integer getContainerConnectionLostCount() {
    return containerConnectionLostCount;
  }

  public void setContainerConnectionLostCount(Integer containerConnectionLostCount) {
    this.containerConnectionLostCount = containerConnectionLostCount;
  }

  public Boolean getContainerIsDecommissioning() {
    return containerIsDecommissioning;
  }

  public void setContainerIsDecommissioning(Boolean containerIsDecommissioning) {
    this.containerIsDecommissioning = containerIsDecommissioning;
  }

  public Long getContainerLaunchedTimestamp() {
    return containerLaunchedTimestamp;
  }

  public void setContainerLaunchedTimestamp(Long containerLaunchedTimestamp) {
    this.containerLaunchedTimestamp = containerLaunchedTimestamp;
  }

  public Long getContainerCompletedTimestamp() {
    return containerCompletedTimestamp;
  }

  public void setContainerCompletedTimestamp(Long containerCompletedTimestamp) {
    this.containerCompletedTimestamp = containerCompletedTimestamp;
  }

  public Integer getContainerExitCode() {
    return containerExitCode;
  }

  public void setContainerExitCode(Integer containerExitCode) {
    this.containerExitCode = containerExitCode;
  }

  public String getContainerExitDiagnostics() {
    return containerExitDiagnostics;
  }

  public void setContainerExitDiagnostics(String containerExitDiagnostics) {
    this.containerExitDiagnostics = containerExitDiagnostics;
  }

  public ExitType getContainerExitType() {
    return containerExitType;
  }

  public void setContainerExitType(ExitType containerExitType) {
    this.containerExitType = containerExitType;
  }
}
