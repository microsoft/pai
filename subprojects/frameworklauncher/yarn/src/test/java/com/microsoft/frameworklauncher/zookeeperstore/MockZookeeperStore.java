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

package com.microsoft.frameworklauncher.zookeeperstore;

import com.microsoft.frameworklauncher.common.log.DefaultLogger;

import java.io.File;

public class MockZookeeperStore extends ZookeeperStore {
  private static final DefaultLogger LOGGER = new DefaultLogger(MockZookeeperStore.class);

  private static MockZookeeperStore instance;

  private MockZookeeperStore(String launchRootPath, Boolean clean)
      throws Exception {
    super(
        new MockZooKeeperClient(),
        new ZookeeperStoreStructure(launchRootPath));
    setupZKStructure(launchRootPath, clean);
  }

  public static ZookeeperStore newInstance(String launchRootPath)
      throws Exception {
    if (instance == null) {
      instance = new MockZookeeperStore(launchRootPath, false);
    }
    return instance;
  }

  public static ZookeeperStore newInstanceWithClean(String launchRootPath)
      throws Exception {
    if (instance == null) {
      instance = new MockZookeeperStore(launchRootPath, true);
    }
    return instance;
  }

  private void setupZKStructure(String rootPath, Boolean clean)
      throws Exception {
    File file = new File(rootPath);
    if (file.exists()) {
      if (!clean) {
        return;
      }

      zkClient.deleteRecursively(rootPath, true);
    }

    file.mkdir();
  }

}
