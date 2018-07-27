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

import com.microsoft.frameworklauncher.common.validation.GpuValidation;
import com.microsoft.frameworklauncher.common.validation.PortValidation;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

// Computation Platform Specific Parameters
public class PlatformSpecificParametersDescriptor implements Serializable {
  @Valid
  @NotNull
  @GpuValidation
  @PortValidation
  private ResourceDescriptor amResource = ResourceDescriptor.newInstance(4096, 1);

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
  @Min(-2)
  // -1 means unlimited.
  // -2 means using default value: LauncherConfiguration.RMResyncFrequency.
  private Integer containerConnectionMaxLostCount = -2;

  @Valid
  @NotNull
  @Min(0)
  // No unlimited option, since exceed Container must be released eventually.
  private Integer containerConnectionMaxExceedCount = 2;

  @Valid
  @NotNull
  // If this feature is enabled, different Tasks is ensured to run on different nodes.
  private Boolean antiaffinityAllocation = false;

  @Valid
  @NotNull
  // If this feature is enabled, the behavior is Gang Scheduling / Allocation,
  // i.e. all Tasks in the Framework will run in an all-or-nothing fashion without resource deadlock.
  // This is used for Frameworks which cannot perform any useful work, such as making progress or serving,
  // until all Tasks are running.
  // Note, if Gang Allocation cannot be satisfied within amGangAllocationTimeoutSec, the whole application
  // will fail. Thus, it is suggested to also enable the Framework FancyRetryPolicy, so that the Framework
  // will be backoff retried later.
  //
  // If this feature is disabled, the behavior is the Incremental Scheduling / Allocation,
  // i.e. any Task in the Framework will run as soon as its Container is allocated, regardless of any other outstanding Task.
  // This is used for Frameworks which can still perform useful works, such as making progress or serving,
  // even when only one Task is running.
  private Boolean gangAllocation = false;

  @Valid
  @NotNull
  // Only used for Port Scheduling and Gpu Scheduling.
  // If this feature is enabled, the resource already tried in previous tasks' allocation will be
  // skipped to consider in current scheduling.
  private Boolean skipLocalTriedResource = true;

  @Valid
  @NotNull
  private AMType amType = AMType.DEFAULT;

  @Valid
  @NotNull
  // The following will take effect only if amType is "AGENT".
  // If this feature is enabled, Agent will be enabled to send heartbeats to AM.
  private Boolean agentUseHeartbeat = false;

  @Valid
  @NotNull
  // The following will take effect only if amType is "AGENT" and AgentUseAgent flag is true.
  // Frameworks should not set agentHeartbeatIntervalSec to be smaller than LauncherStatus.AgentAMCheckAgentHeartbeatsIntervalSec
  private Integer agentHeartbeatIntervalSec = 30;

  @Valid
  @NotNull
  // This is the value when AgentAM does not receive the heartbeats for this interval, the agent is treated as expired.
  // It should be a value larger than agentHeartbeatIntervalSec.
  private Integer agentExpiryIntervalSec = 180;

  @Valid
  @NotNull
  // If this feature is enabled, Agent will be enabled to do health checking for user applications.
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

  public Boolean getGangAllocation() {
    return gangAllocation;
  }

  public void setGangAllocation(Boolean gangAllocation) {
    this.gangAllocation = gangAllocation;
  }

  public Boolean getSkipLocalTriedResource() {
    return skipLocalTriedResource;
  }

  public void setSkipLocalTriedResource(Boolean skipLocalTriedResource) {
    this.skipLocalTriedResource = skipLocalTriedResource;
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
