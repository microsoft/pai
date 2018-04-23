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

package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.common.model.Ports;
import com.microsoft.frameworklauncher.common.model.RetryPolicyState;
import org.apache.hadoop.yarn.api.records.Container;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;

import java.util.Map;

public class TaskEvent {
  private ContainerRequest containerRequest;
  private Container container;
  private Integer containerExitCode;
  private String containerExitDiagnostics;
  private RetryPolicyState newRetryPolicyState;
  private Map<String, Ports> portDefinitions;

  public ContainerRequest getContainerRequest() {
    return containerRequest;
  }

  public TaskEvent setContainerRequest(ContainerRequest containerRequest) {
    this.containerRequest = containerRequest;
    return this;
  }

  public Container getContainer() {
    return container;
  }

  public TaskEvent setContainer(Container container) {
    this.container = container;
    return this;
  }

  public Integer getContainerExitCode() {
    return containerExitCode;
  }

  public TaskEvent setContainerExitCode(Integer containerExitCode) {
    this.containerExitCode = containerExitCode;
    return this;
  }

  public String getContainerExitDiagnostics() {
    return containerExitDiagnostics;
  }

  public TaskEvent setContainerExitDiagnostics(String containerExitDiagnostics) {
    this.containerExitDiagnostics = containerExitDiagnostics;
    return this;
  }

  public RetryPolicyState getNewRetryPolicyState() {
    return newRetryPolicyState;
  }

  public TaskEvent setNewRetryPolicyState(RetryPolicyState newRetryPolicyState) {
    this.newRetryPolicyState = newRetryPolicyState;
    return this;
  }

  public Map<String, Ports> getPortDefinitions() {
    return portDefinitions;
  }

  public TaskEvent setPortDefinitions(Map<String, Ports> portDefinitions) {
    this.portDefinitions = portDefinitions;
    return this;
  }
}
