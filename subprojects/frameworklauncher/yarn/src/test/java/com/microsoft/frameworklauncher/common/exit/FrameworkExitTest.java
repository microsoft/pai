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

package com.microsoft.frameworklauncher.common.exit;

import com.microsoft.frameworklauncher.common.model.ExitType;
import com.microsoft.frameworklauncher.common.model.UserContainerExitInfo;
import com.microsoft.frameworklauncher.common.model.UserContainerExitSpec;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.testutils.YamlTestUtils;
import org.apache.hadoop.yarn.api.records.ContainerExitStatus;
import org.junit.Assert;
import org.junit.Test;

public class FrameworkExitTest {
  @Test
  public void testFrameworkExitSpec() throws Exception {
    String configFileName = "user-container-exit-spec";
    String resultFilePath = YamlTestUtils.INPUTS_DIR + configFileName + ".yml";

    // Test initialize
    UserContainerExitSpec userContainerExitSpec = FrameworkExitSpec.initialize(
        YamlUtils.toObject(resultFilePath, UserContainerExitSpec.class));
    System.out.println(WebCommon.toJson(userContainerExitSpec));

    for (UserContainerExitInfo userContainerExitInfo : userContainerExitSpec.getSpec()) {
      Assert.assertTrue(String.format("Effective UserContainerExitSpec contains bad ExitInfo: %s",
          WebCommon.toJson(userContainerExitInfo)),
          userContainerExitInfo.getDescription().contains("GoodCode"));
    }

    // Test lookupExitCode and getExitInfo
    // Predefined ExitCode
    Assert.assertEquals(
        FrameworkExitCode.CONTAINER_EXPIRED.toInt(),
        FrameworkExitSpec.lookupExitCode(ContainerExitStatus.ABORTED, "XXX Container expired since it was unused XXX"));
    Assert.assertEquals(
        FrameworkExitCode.CONTAINER_NODE_LOST.toInt(),
        FrameworkExitSpec.lookupExitCode(ContainerExitStatus.ABORTED, "XXX Container released on a *lost* node XXX"));
    Assert.assertEquals(
        FrameworkExitCode.CONTAINER_ABORTED.toInt(),
        FrameworkExitSpec.lookupExitCode(ContainerExitStatus.ABORTED, "XXX"));
    Assert.assertEquals(
        FrameworkExitCode.CONTAINER_ABORTED.toInt(),
        FrameworkExitSpec.lookupExitCode(ContainerExitStatus.ABORTED, null));
    Assert.assertEquals(
        FrameworkExitCode.SUCCEEDED.toInt(),
        FrameworkExitSpec.lookupExitCode(0, null));
    // UserContainerExitSpec
    Assert.assertEquals(
        193,
        FrameworkExitSpec.lookupExitCode(193, null));
    Assert.assertEquals(
        ExitType.TRANSIENT_NORMAL,
        FrameworkExitSpec.getExitInfo(193).getType());
    System.out.println(WebCommon.toJson(FrameworkExitSpec.getExitInfo(193)));
    // Unknown ExitCode
    Assert.assertEquals(
        222,
        FrameworkExitSpec.lookupExitCode(222, null));
    Assert.assertEquals(
        ExitType.UNKNOWN,
        FrameworkExitSpec.getExitInfo(222).getType());
    System.out.println(WebCommon.toJson(FrameworkExitSpec.getExitInfo(222)));
    Assert.assertEquals(
        -222,
        FrameworkExitSpec.lookupExitCode(-222, null));
    Assert.assertEquals(
        ExitType.UNKNOWN,
        FrameworkExitSpec.getExitInfo(-222).getType());
    System.out.println(WebCommon.toJson(FrameworkExitSpec.getExitInfo(-222)));
  }
}