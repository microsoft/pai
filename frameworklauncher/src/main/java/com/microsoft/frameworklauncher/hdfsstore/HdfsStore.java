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

import com.google.common.annotations.VisibleForTesting;
import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;

import java.util.Set;

public class HdfsStore {
  private static final DefaultLogger LOGGER = new DefaultLogger(HdfsStore.class);

  private final HdfsStoreStructure hdfsStruct;

  public HdfsStore(String launcherRootPath) throws Exception {
    LOGGER.logInfo("Initializing HdfsStore: [LauncherRootPath] = [%s]", launcherRootPath);
    hdfsStruct = new HdfsStoreStructure(launcherRootPath);
    setupHDFSStructure();
  }

  public HdfsStoreStructure getHdfsStruct() {
    return hdfsStruct;
  }

  // Setup Basic HdfsStoreStructure
  @VisibleForTesting
  protected void setupHDFSStructure() throws Exception {
    HadoopUtils.makeDirInHdfs(hdfsStruct.getLauncherRootPath());
  }

  public Set<String> getFrameworkNames() throws Exception {
    return HadoopUtils.listDirInHdfs(hdfsStruct.getLauncherRootPath());
  }

  public void makeFrameworkRootDir(String frameworkName) throws Exception {
    HadoopUtils.makeDirInHdfs(hdfsStruct.getFrameworkRootPath(frameworkName));
  }

  public void removeFrameworkRoot(String frameworkName) throws Exception {
    HadoopUtils.removeDirInHdfs(hdfsStruct.getFrameworkRootPath(frameworkName));
  }

  public void makeAMStoreRootDir(String frameworkName) throws Exception {
    HadoopUtils.makeDirInHdfs(hdfsStruct.getAMStoreRootPath(frameworkName));
  }

  public String uploadAMPackageFile(String frameworkName) throws Exception {
    String hdfsPath = hdfsStruct.getAMPackageFilePath(frameworkName);
    HadoopUtils.uploadFileToHdfs(GlobalConstants.PACKAGE_APPLICATION_MASTER_FILE, hdfsPath);
    return hdfsPath;
  }

  public String uploadAgentPackageFile(String frameworkName) throws Exception {
    String hdfsPath = hdfsStruct.getAgentPackageFilePath(frameworkName);
    HadoopUtils.uploadFileToHdfs(GlobalConstants.PACKAGE_AGENT_FILE, hdfsPath);
    return hdfsPath;
  }

  public String uploadContainerIpListFile(String frameworkName) throws Exception {
    String hdfsPath = hdfsStruct.getContainerIpListFilePath(frameworkName);
    HadoopUtils.uploadFileToHdfs(GlobalConstants.CONTAINER_IP_LIST_FILE, hdfsPath);
    return hdfsPath;
  }
}
