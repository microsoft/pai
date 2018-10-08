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

import com.microsoft.frameworklauncher.common.exceptions.BadRequestException;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.validation.CommonValidation;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.testutils.YamlTestUtils;
import org.junit.Assert;
import org.junit.Test;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import java.util.Arrays;
import java.util.List;

import static com.microsoft.frameworklauncher.testutils.YamlTestUtils.INPUTS_DIR;

public class FrameworkDescriptorTest {

  /**
   * Test ConfigurationUtils.ReadFrameworkDescriptionFromContent()
   * Assume YamlUtils is right
   */
  @Test
  public void testFrameworkDescriptor() throws Exception {
    List<String> configFileNames = Arrays.asList("FrameworkDescriptionMini", "FrameworkDescriptionFull");
    for (String configFileName : configFileNames) {
      String inputJsonFilePath = INPUTS_DIR + configFileName + ".json";
      String descriptionContent = CommonUtils.readFile(inputJsonFilePath);
      FrameworkDescriptor frameworkDescriptor = WebCommon.toObject(descriptionContent, FrameworkDescriptor.class);
      try {
        CommonValidation.validate(frameworkDescriptor);
      } catch (BadRequestException e) {
        String m = e.getMessage();
        System.out.println(m);

        if (e.getCause() != null && e.getCause() instanceof ConstraintViolationException) {
          ConstraintViolationException cve = (ConstraintViolationException) e.getCause();
          for (ConstraintViolation<?> cv : cve.getConstraintViolations()) {
            if (!cv.getMessage().contains("local hadoop library doesn't support")) {
              throw e;
            }
          }
        } else {
          throw e;
        }
      }
      YamlTestUtils.testObjectToYaml(frameworkDescriptor, configFileName, FrameworkDescriptor.class);
    }
  }


  @Test
  public void testWrongFrameworkDescriptor() throws Exception {
    List<String> configFileNames = Arrays.asList("WrongFrameworkDescription");
    for (String configFileName : configFileNames) {
      String inputJsonFilePath = INPUTS_DIR + configFileName + ".json";
      String descriptionContent = CommonUtils.readFile(inputJsonFilePath);
      FrameworkDescriptor frameworkDescriptor = WebCommon.toObject(descriptionContent, FrameworkDescriptor.class);

      try {
        CommonValidation.validate(frameworkDescriptor);
        Assert.fail("Wrong json file validate success");
      } catch (BadRequestException e) {
        String m = e.getMessage();
        System.out.println(m);

        // Built-in validations
        Assert.assertTrue(m.contains("taskRoles[HBaseMaster].taskNumber: " +
            "must be less than or equal to"));
        Assert.assertTrue(m.contains("taskRoles[HBaseMaster].taskService.resource.portDefinitions: " +
            "may not be null"));
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource.portDefinitions[tcp].start: " +
            "may not be null"));
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource.portDefinitions[tcp].count: " +
            "may not be null"));
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource.portDefinitions[tcp2].count: " +
            "may not be null"));

        // GpuValidation
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource: " +
            "GpuNumber [2] is not consistent with GpuAttribute [1(1)]"));

        // MapKeyNamingValidation
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource.portDefinitions: " +
            "Name [ht%%tp] is not matched with naming convention regex"));

        // MapValueNotNullValidation
        Assert.assertTrue(m.contains("taskRoles[HBaseRegionServer].taskService.resource.portDefinitions: " +
            "Map value is null for Map key: [ht%%tp]"));
      }
    }
  }

}