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

public class LauncherRequest implements Serializable {
  @Valid
  private String launchingDataDeploymentVersion;

  @Valid
  private String launchedDataDeploymentVersion;

  @Valid
  @NotNull
  private ClusterConfiguration clusterConfiguration = new ClusterConfiguration();

  @Valid
  @NotNull
  private AclConfiguration aclConfiguration = new AclConfiguration();

  public String getLaunchingDataDeploymentVersion() {
    return launchingDataDeploymentVersion;
  }

  public void setLaunchingDataDeploymentVersion(String launchingDataDeploymentVersion) {
    this.launchingDataDeploymentVersion = launchingDataDeploymentVersion;
  }

  public String getLaunchedDataDeploymentVersion() {
    return launchedDataDeploymentVersion;
  }

  public void setLaunchedDataDeploymentVersion(String launchedDataDeploymentVersion) {
    this.launchedDataDeploymentVersion = launchedDataDeploymentVersion;
  }

  public ClusterConfiguration getClusterConfiguration() {
    return clusterConfiguration;
  }

  public void setClusterConfiguration(ClusterConfiguration clusterConfiguration) {
    this.clusterConfiguration = clusterConfiguration;
  }

  public AclConfiguration getAclConfiguration() {
    return aclConfiguration;
  }

  public void setAclConfiguration(AclConfiguration aclConfiguration) {
    this.aclConfiguration = aclConfiguration;
  }
}
