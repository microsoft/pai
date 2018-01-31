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

package com.microsoft.frameworklauncher.hdfsstore;

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import org.apache.commons.io.FilenameUtils;

// Define Launcher HdfsStoreStructure
public class HdfsStoreStructure {
  private final String launcherRootPath;

  public HdfsStoreStructure(String launcherRootPath) {
    this.launcherRootPath = launcherRootPath;
  }

  public String getLauncherRootPath() {
    return launcherRootPath;
  }

  public String getFrameworkRootPath(String frameworkName) {
    return HadoopUtils.getHdfsNodePath(launcherRootPath, frameworkName);
  }

  public String getAMPackageFilePath(String frameworkName) {
    return HadoopUtils.getHdfsNodePath(getFrameworkRootPath(frameworkName),
        FilenameUtils.getName(GlobalConstants.PACKAGE_APPLICATION_MASTER_FILE));
  }

  public String getAgentPackageFilePath(String frameworkName) {
    return HadoopUtils.getHdfsNodePath(getFrameworkRootPath(frameworkName),
        FilenameUtils.getName(GlobalConstants.PACKAGE_AGENT_FILE));
  }

  public String getAMStoreRootPath(String frameworkName) {
    return HadoopUtils.getHdfsNodePath(getFrameworkRootPath(frameworkName), "AMStore");
  }

  public String getContainerIpListFilePath(String frameworkName) {
    return HadoopUtils.getHdfsNodePath(getAMStoreRootPath(frameworkName),
        FilenameUtils.getName(GlobalConstants.CONTAINER_IP_LIST_FILE));
  }
}
