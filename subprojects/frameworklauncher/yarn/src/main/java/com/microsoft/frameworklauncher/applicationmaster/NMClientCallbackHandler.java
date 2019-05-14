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

import org.apache.hadoop.yarn.api.records.ContainerId;
import org.apache.hadoop.yarn.api.records.ContainerStatus;
import org.apache.hadoop.yarn.api.records.Resource;
import org.apache.hadoop.yarn.client.api.async.NMClientAsync;

import java.nio.ByteBuffer;
import java.util.Map;

public class NMClientCallbackHandler extends NMClientAsync.AbstractCallbackHandler {
  private final ApplicationMaster am;

  public NMClientCallbackHandler(ApplicationMaster am) {
    this.am = am;
  }

  @Override
  public void onContainerStarted(ContainerId containerId, Map<String, ByteBuffer> allServiceResponse) {
    am.onContainerStarted(containerId, allServiceResponse);
  }

  @Override
  public void onStartContainerError(ContainerId containerId, Throwable e) {
    am.onStartContainerError(containerId, e);
  }

  @Override
  public void onContainerStopped(ContainerId containerId) {
    am.onContainerStopped(containerId);
  }

  @Override
  public void onStopContainerError(ContainerId containerId, Throwable e) {
    am.onStopContainerError(containerId, e);
  }

  @Override
  public void onContainerStatusReceived(ContainerId containerId, ContainerStatus containerStatus) {
    am.onContainerStatusReceived(containerId, containerStatus);
  }

  @Override
  public void onGetContainerStatusError(ContainerId containerId, Throwable e) {
    am.onGetContainerStatusError(containerId, e);
  }

  @Deprecated
  @Override
  public void onContainerResourceIncreased(ContainerId containerId, Resource resource) {
  }

  @Deprecated
  @Override
  public void onIncreaseContainerResourceError(ContainerId containerId, Throwable t) {
  }

  @Override
  public void onContainerResourceUpdated(ContainerId containerId, Resource resource) {
  }

  @Override
  public void onUpdateContainerResourceError(ContainerId containerId, Throwable t) {
  }
}
