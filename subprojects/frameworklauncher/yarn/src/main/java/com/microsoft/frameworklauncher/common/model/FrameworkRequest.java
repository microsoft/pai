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

public class FrameworkRequest implements Serializable {
  private String frameworkName;
  private FrameworkDescriptor frameworkDescriptor;
  private LaunchClientType launchClientType = LaunchClientType.UNKNOWN;
  private String launchClientHostName;
  private String launchClientUserName;
  private Long firstRequestTimestamp;
  private Long lastRequestTimestamp;

  public String getFrameworkName() {
    return frameworkName;
  }

  public void setFrameworkName(String frameworkName) {
    this.frameworkName = frameworkName;
  }

  public FrameworkDescriptor getFrameworkDescriptor() {
    return frameworkDescriptor;
  }

  public void setFrameworkDescriptor(FrameworkDescriptor frameworkDescriptor) {
    this.frameworkDescriptor = frameworkDescriptor;
  }

  public LaunchClientType getLaunchClientType() {
    return launchClientType;
  }

  public void setLaunchClientType(LaunchClientType launchClientType) {
    this.launchClientType = launchClientType;
  }

  public String getLaunchClientHostName() {
    return launchClientHostName;
  }

  public void setLaunchClientHostName(String launchClientHostName) {
    this.launchClientHostName = launchClientHostName;
  }

  public String getLaunchClientUserName() {
    return launchClientUserName;
  }

  public void setLaunchClientUserName(String launchClientUserName) {
    this.launchClientUserName = launchClientUserName;
  }

  public Long getFirstRequestTimestamp() {
    return firstRequestTimestamp;
  }

  public void setFirstRequestTimestamp(Long firstRequestTimestamp) {
    this.firstRequestTimestamp = firstRequestTimestamp;
  }

  public Long getLastRequestTimestamp() {
    return lastRequestTimestamp;
  }

  public void setLastRequestTimestamp(Long lastRequestTimestamp) {
    this.lastRequestTimestamp = lastRequestTimestamp;
  }
}
