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

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.service.SystemTaskQueue;
import com.microsoft.frameworklauncher.hdfsstore.MockHdfsStore;
import com.microsoft.frameworklauncher.testutils.FeatureTestUtils;
import com.microsoft.frameworklauncher.zookeeperstore.MockZookeeperStore;

import java.util.Map;

public class MockApplicationMaster extends ApplicationMaster {
  private final DefaultLogger LOGGER = new DefaultLogger(MockApplicationMaster.class);

  @Override
  protected void initialize() throws Exception {
    transitionTaskStateQueue = new SystemTaskQueue(this::handleException);

    // Initialize AM NoDependenceConfig
    conf = new MockConfiguration();
    conf.initializeNoDependenceConfig();

    // Initialize Launcher Store
    zkStore = MockZookeeperStore.newInstance(FeatureTestUtils.ZK_BASE_DIR);
    conf.initializeDependOnZKStoreConfig(zkStore);

    nmClient = new MockNMClient(
        new NMClientCallbackHandler(this));

    hdfsStore = new MockHdfsStore(conf.getLauncherConfig().getHdfsRootDir());
    hdfsStore.makeFrameworkRootDir(conf.getFrameworkName());
    hdfsStore.makeAMStoreRootDir(conf.getFrameworkName());
    statusManager = new StatusManager(this, conf, zkStore);
    requestManager = new RequestManager(this, conf, zkStore, launcherClient);
    selectionManager = new SelectionManager(conf.getLauncherConfig(), statusManager, requestManager);
  }

  @Override
  protected void recover() throws Exception {
    statusManager.start();
  }

  public void onServiceVersionsUpdated(Map<String, Integer> serviceVersions) {
    LOGGER.logInfo("onServiceVersionsUpdated: ServiceVersions: %s", CommonExts.toString(serviceVersions));
  }

  @Override
  public void onStartRMResyncHandler() {
    LOGGER.logInfo("onStartRMResyncHandler");
    LOGGER.logInfo("All the previous CONTAINER_RUNNING Tasks have been driven");
  }
}
