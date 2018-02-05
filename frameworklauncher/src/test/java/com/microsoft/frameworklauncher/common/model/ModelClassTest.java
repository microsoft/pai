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

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.testutils.YamlTestUtils;
import org.junit.Test;

import java.io.File;

import static com.microsoft.frameworklauncher.testutils.YamlTestUtils.EXPECTS_DIR;

public class ModelClassTest {
  private static final DefaultLogger LOGGER = new DefaultLogger(ModelClassTest.class);

  @Test
  public void testObjectToYaml() throws Exception {
    Package p = ModelClassTest.class.getPackage();
    String pName = p.getName();
    String pPath = "src.main.java." + pName;
    String fileName = pPath.replace(".", File.separator);
    File file = new File(System.getProperty("user.dir") + File.separator + fileName);

    // Get all class in common.model
    for (String classFileName : file.list()) {
      int idx = classFileName.indexOf(".java");
      String className = classFileName.substring(0, idx);
      Class<?> c = Class.forName(pName + "." + className);
      if (c.isEnum())
        continue;

      LOGGER.logInfo("Test %s", className);
      YamlTestUtils.testClasses(c);
      LOGGER.logInfo("Test %s success", className);
    }
  }

  @Test
  public void testField() throws Exception {
    Package p = ModelClassTest.class.getPackage();
    String pName = p.getName();
    File file = new File(EXPECTS_DIR);

    // Get all class in common.model
    for (String classFileName : file.list()) {
      int idx = classFileName.indexOf(".yml");
      String className = classFileName.substring(0, idx);
      Class<?> c = Class.forName(pName + "." + className);
      if (c.isEnum())
        continue;

      LOGGER.logInfo("Test %s", className);
      YamlTestUtils.testField(EXPECTS_DIR + classFileName, c);
      LOGGER.logInfo("Test %s success", className);
    }
  }

}