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
import com.microsoft.frameworklauncher.common.utils.CommonUtils;

import java.io.File;
import java.io.IOException;

public class MockHdfsStore extends HdfsStore {

  public MockHdfsStore(String launcherRootPath) throws Exception {
    super(launcherRootPath);
  }

  @Override
  protected void setupHDFSStructure() throws Exception {
    createDir(getHdfsStruct().getLauncherRootPath());
  }

  @Override
  public void makeFrameworkRootDir(String frameworkName) throws Exception {
    createDir(getHdfsStruct().getFrameworkRootPath(frameworkName));
  }

  @Override
  public void removeFrameworkRoot(String frameworkName) throws Exception {
    deleteFile(getHdfsStruct().getFrameworkRootPath(frameworkName));
  }

  private void deleteFile(String path) {
    File file = new File(path);
    if (file.isDirectory()) {
      File[] subFiles = file.listFiles();
      for (File subFile : subFiles) {
        deleteFile(subFile.getAbsolutePath());
      }
    }

    file.delete();
  }

  @Override
  public void makeAMStoreRootDir(String frameworkName) throws Exception {
    createDir(getHdfsStruct().getAMStoreRootPath(frameworkName));
  }

  private void createDir(String path) throws Exception {
    File file = new File(path);
    if (!file.exists()) {
      if (!file.mkdir())
        throw new IOException("Mkdirs failed to create " + path);
    }
  }

  @Override
  public String uploadContainerIpListFile(String frameworkName) throws Exception {
    String hdfsPath = getHdfsStruct().getContainerIpListFilePath(frameworkName);
    CommonUtils.writeFile(hdfsPath, CommonUtils.readFile(GlobalConstants.CONTAINER_IP_LIST_FILE));
    return hdfsPath;
  }

}