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

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.model.ResourceDescriptor;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;

public class MockConfiguration extends Configuration {
  private String frameworkName;
  private Integer frameworkVersion;
  private Integer amVersion;

  @Override
  public void initializeNoDependenceConfig() throws Exception {
    frameworkName = CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_FRAMEWORK_NAME, "NAME");
    frameworkVersion = Integer.parseInt(CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_FRAMEWORK_VERSION, "0"));
    amVersion = Integer.parseInt(CommonUtils.getEnvironmentVariable(GlobalConstants.ENV_VAR_AM_VERSION, "0"));
  }

  @Override
  protected String getFrameworkName() {
    return frameworkName;
  }

  @Override
  protected Integer getFrameworkVersion() {
    return frameworkVersion;
  }

  @Override
  protected Integer getAmVersion() {
    return amVersion;
  }

  @Override
  protected String getAmUser() {
    return "hadoop";
  }

  @Override
  protected String getAmLocalDirs() {
    return "/data/yarnnm/local/usercache/hadoop/appcache/application_1495012002081_6517";
  }

  @Override
  protected String getAmLogDirs() {
    return "/data/yarnnm/logs/application_1495012002081_6517/container_e03_1495012002081_6517_01_000003";
  }

  @Override
  protected String getAmContainerId() {
    return "container_e03_1495012002081_6517_01_000003";
  }

  @Override
  protected ResourceDescriptor getMaxResource() {
    return ResourceDescriptor.newInstance(2048, 1, 0, 0L);
  }

  @Override
  protected String getAmQueue() {
    return "default";
  }
}
