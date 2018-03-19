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

import com.microsoft.frameworklauncher.common.validation.GpuConsistentValidation;
import com.microsoft.frameworklauncher.common.validation.PortConsistentValidation;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

// Computation Platform Specific Parameters
public class PlatformSpecificParametersDescriptor implements Serializable {
  @Valid
  @GpuConsistentValidation
  @PortConsistentValidation
  // If you want to use the LauncherConfiguration.amDefaultResource, do not set it or set it to null.
  private ResourceDescriptor amResource;

  @Valid
  private String amNodeLabel;

  @Valid
  private String taskNodeLabel;

  @Valid
  @Pattern(regexp = "^[^\\s]{1,256}$")
  private String taskNodeGpuType;

  @Valid
  @NotNull
  private String queue = "default";

  @Valid
  @NotNull
  // -1 means unlimit.
  // -2 means using default value: LauncherConfiguration.RMResyncFrequency.
  private Integer containerConnectionMaxLostCount = -2;

  @Valid
  @NotNull
  // No unlimit option, since exceed Container must be released eventually.
  private Integer containerConnectionMaxExceedCount = 2;

  @Valid
  @NotNull
  // If this feature enabled, different Tasks is ensured to run on different nodes.
  private Boolean antiaffinityAllocation = false;

  @Valid
  @NotNull
  // If this feature enabled, all Running Tasks will be killed after any TASK_COMPLETED.
  private Boolean killAllOnAnyCompleted = false;

  @Valid
  @NotNull
  // If this feature enabled, all Running Tasks will be killed after any TASK_COMPLETED
  // which is due to the exit of UserService.
  private Boolean killAllOnAnyServiceCompleted = false;

  @Valid
  @NotNull
  // If this feature enabled, AM will wait until all Tasks become CONTAINER_ALLOCATED and
  // then Launches them together.
  // Besides, a ContainerIpList file will be generated in each Task's current working directory.
  // All the Tasks' IPAddresses are recorded consistently in this file, and the assigned current
  // Task's IPAddress can be retrieved from its environment variable CONTAINER_IP.
  private Boolean generateContainerIpList = false;

  @Valid
  @NotNull
  private AMType amType = AMType.DEFAULT;

  @Valid
  @NotNull
  // The following will take effect only if amType is "AGENT".
  // If this feature enabled, Agent will be enabled to send heartbeats to AM.
  private Boolean agentUseHeartbeat = false;

  @Valid
  @NotNull
  // The following will take effect only if amType is "AGENT" and AgentUseAgent flag is true.
  // Frameworks should not set agentHeartbeatIntervalSec to be smaller than LauncherStatus.AgentAMCheckAgentHearbeatsIntervalSec
  private Integer agentHeartbeatIntervalSec = 30;

  @Valid
  @NotNull
  // This is the value when AgentAM does not receive the heartbeats for this interval, the agent is treated as expired.
  // It should be a value larger than agentHeartbeatIntervalSec.
  private Integer agentExpiryIntervalSec = 180;

  @Valid
  @NotNull
  // If this feature enabled, Agent will be enabled to do health checking for user applications.
  private Boolean agentUseHealthCheck = false;

  @Valid
  private HealthCheckDescriptor taskServiceHealthCheck;

  public ResourceDescriptor getAmResource() {
    return amResource;
  }

  public void setAmResource(ResourceDescriptor amResource) {
    this.amResource = amResource;
  }

  public String getAmNodeLabel() {
    return amNodeLabel;
  }

  public void setAmNodeLabel(String amNodeLabel) {
    this.amNodeLabel = amNodeLabel;
  }

  public String getTaskNodeLabel() {
    return taskNodeLabel;
  }

  public void setTaskNodeLabel(String taskNodeLabel) {
    this.taskNodeLabel = taskNodeLabel;
  }

  public String getTaskNodeGpuType() {
    return taskNodeGpuType;
  }

  public void setTaskNodeGpuType(String taskNodeGpuType) {
    this.taskNodeGpuType = taskNodeGpuType;
  }

  public String getQueue() {
    return queue;
  }

  public void setQueue(String queue) {
    this.queue = queue;
  }

  public Integer getContainerConnectionMaxLostCount() {
    return containerConnectionMaxLostCount;
  }

  public void setContainerConnectionMaxLostCount(Integer containerConnectionMaxLostCount) {
    this.containerConnectionMaxLostCount = containerConnectionMaxLostCount;
  }

  public Integer getContainerConnectionMaxExceedCount() {
    return containerConnectionMaxExceedCount;
  }

  public void setContainerConnectionMaxExceedCount(Integer containerConnectionMaxExceedCount) {
    this.containerConnectionMaxExceedCount = containerConnectionMaxExceedCount;
  }

  public Boolean getAntiaffinityAllocation() {
    return antiaffinityAllocation;
  }

  public void setAntiaffinityAllocation(Boolean antiaffinityAllocation) {
    this.antiaffinityAllocation = antiaffinityAllocation;
  }

  public Boolean getKillAllOnAnyCompleted() {
    return killAllOnAnyCompleted;
  }

  public void setKillAllOnAnyCompleted(Boolean killAllOnAnyCompleted) {
    this.killAllOnAnyCompleted = killAllOnAnyCompleted;
  }

  public Boolean getKillAllOnAnyServiceCompleted() {
    return killAllOnAnyServiceCompleted;
  }

  public void setKillAllOnAnyServiceCompleted(Boolean killAllOnAnyServiceCompleted) {
    this.killAllOnAnyServiceCompleted = killAllOnAnyServiceCompleted;
  }

  public Boolean getGenerateContainerIpList() {
    return generateContainerIpList;
  }

  public void setGenerateContainerIpList(Boolean generateContainerIpList) {
    this.generateContainerIpList = generateContainerIpList;
  }

  public AMType getAmType() {
    return amType;
  }

  public void setAmType(AMType amType) {
    this.amType = amType;
  }

  public Boolean getAgentUseHeartbeat() {
    return agentUseHeartbeat;
  }

  public void setAgentUseHeartbeat(Boolean agentUseHeartbeat) {
    this.agentUseHeartbeat = agentUseHeartbeat;
  }

  public Integer getAgentHeartbeatIntervalSec() {
    return agentHeartbeatIntervalSec;
  }

  public void setAgentHeartbeatIntervalSec(Integer agentHeartbeatIntervalSec) {
    this.agentHeartbeatIntervalSec = agentHeartbeatIntervalSec;
  }

  public Integer getAgentExpiryIntervalSec() {
    return agentExpiryIntervalSec;
  }

  public void setAgentExpiryIntervalSec(Integer agentExpiryIntervalSec) {
    this.agentExpiryIntervalSec = agentExpiryIntervalSec;
  }

  public Boolean getAgentUseHealthCheck() {
    return agentUseHealthCheck;
  }

  public void setAgentUseHealthCheck(Boolean agentUseHealthCheck) {
    this.agentUseHealthCheck = agentUseHealthCheck;
  }

  public HealthCheckDescriptor getTaskServiceHealthCheck() {
    return taskServiceHealthCheck;
  }

  public void setTaskServiceHealthCheck(HealthCheckDescriptor taskServiceHealthCheck) {
    this.taskServiceHealthCheck = taskServiceHealthCheck;
  }
}
