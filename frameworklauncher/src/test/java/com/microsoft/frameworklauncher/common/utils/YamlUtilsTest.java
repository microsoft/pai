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

package com.microsoft.frameworklauncher.common.utils;

import com.microsoft.frameworklauncher.testutils.YamlTestUtils;
import org.junit.Assert;
import org.junit.Test;

import java.io.Serializable;
import java.util.Date;

public class YamlUtilsTest {

  @Test
  public void testDeepCopy() throws Exception {
    String configFileName = "yamlTestFile";
    String resultFilePath = YamlTestUtils.RESULTS_DIR + configFileName + ".yml";

    YamlUtilsTestHelper object = YamlUtilsTestHelper.newInstance(
        1024, 3.14f, 3.14, true, "Yaml Test");

    // Test: Object <-> File
    YamlUtils.toFile(object, resultFilePath);
    String resultYamlForDebug = CommonUtils.readFile(resultFilePath);
    System.out.println(new Date());
    System.out.println(resultYamlForDebug);

    YamlUtilsTestHelper resultObjectFromFile =
        YamlUtils.toObject(resultFilePath, YamlUtilsTestHelper.class);

    // Compare Result and Expect
    Assert.assertTrue(
        String.format("%s: Test result and expect do not match!", configFileName),
        YamlUtils.deepEquals(object, resultObjectFromFile));

    // Test Bytes <-> Object
    YamlUtilsTestHelper resultObjectFromBytes =
        YamlUtils.toObject(YamlUtils.toBytes(object), YamlUtilsTestHelper.class);
    Assert.assertTrue(
        YamlUtils.deepEquals(object, resultObjectFromBytes));

    // Test DeepCopy
    YamlUtilsTestHelper resultObjectFromDeepCopy = YamlUtils.deepCopy(object, YamlUtilsTestHelper.class);
    Assert.assertTrue(
        YamlUtils.deepEquals(object, resultObjectFromDeepCopy));

    resultObjectFromDeepCopy.setNullField("");
    Assert.assertFalse(
        YamlUtils.deepEquals(object, resultObjectFromDeepCopy));

    resultObjectFromDeepCopy.setNullField(null);
    Assert.assertTrue(
        YamlUtils.deepEquals(object, resultObjectFromDeepCopy));

    resultObjectFromDeepCopy.setIntegerField(null);
    Assert.assertFalse(
        YamlUtils.deepEquals(object, resultObjectFromDeepCopy));

    resultObjectFromDeepCopy.setIntegerField(1024);
    Assert.assertTrue(
        YamlUtils.deepEquals(object, resultObjectFromDeepCopy));
  }

  @Test
  public void testDefaultValue() throws Exception {
    String configFileName = "defaultValueTestFile";
    String resultFilePath = YamlTestUtils.INPUTS_DIR + configFileName + ".yml";

    YamlUtilsTestHelper object = new YamlUtilsTestHelper();
    YamlUtilsTestHelper resultObject =
        YamlUtils.toObject(resultFilePath, YamlUtilsTestHelper.class);

    Assert.assertTrue("Wrong value",
        object.getBooleanClassField() == resultObject.getBooleanClassField());
    Assert.assertTrue("Nullable Field is not null",
        resultObject.getNullField() == null);
    Assert.assertTrue("Default Field is not set",
        YamlUtils.deepEquals(object, resultObject));
  }

  @Test
  public void testReadYaml() throws Exception {
    String configFileName = "readYamlTestFile";
    String resultFilePath = YamlTestUtils.INPUTS_DIR + configFileName + ".yml";

    YamlUtilsTestHelper object = YamlUtilsTestHelper.newInstance(
        1024, 3.14f, 3.14, true, "Yaml Test");
    YamlUtilsTestHelper resultObject =
        YamlUtils.toObject(resultFilePath, YamlUtilsTestHelper.class);

    Assert.assertTrue(YamlUtils.deepEquals(object, resultObject));
  }

  @Test
  public void testYamlEquals() throws Exception {
    YamlUtilsTestHelper object1 = null;
    YamlUtilsTestHelper object2 = new YamlUtilsTestHelper();
    YamlUtilsTestHelper object3 = new YamlUtilsTestHelper();
    YamlUtilsTestHelper object4 = YamlUtilsTestHelper.newInstance(
        1024, 3.14f, 3.14, true, "Yaml Test");

    Assert.assertFalse(YamlUtils.deepEquals(object1, object2));
    Assert.assertFalse(YamlUtils.deepEquals(object1, object4));
    Assert.assertFalse(YamlUtils.deepEquals(object2, object4));
    Assert.assertTrue(YamlUtils.deepEquals(object2, object3));
  }

  @Test
  public void testYamlCompatibility() throws Exception {
    YamlUtilsTestCompatibilityHelper object =
        YamlUtilsTestCompatibilityHelper.newInstance(
            1024, "String Test", new YamlUtilsTestCompatibilityHelper().getExtraField());

    YamlUtilsTestCompatibilityHelper resultObjectFromOldBytes =
        YamlUtils.toObject(YamlUtils.toBytes(
            YamlUtilsTestHelper.newInstance(object.getIntField(), 3.14f, 3.14, true, object.getStringField())),
            YamlUtilsTestCompatibilityHelper.class);

    // Ensure all Yaml fields are optional
    Assert.assertTrue(
        YamlUtils.deepEquals(object, resultObjectFromOldBytes));
  }

  public static class YamlUtilsTestHelper implements Serializable {
    private int intField = 1;
    private Integer integerField = 2;
    private float floatField = 1.0f;
    private Float floatClassField = 2.0f;
    private double doubleField = 1.5;
    private Double doubleClassField = 2.5;
    private boolean booleanField = true;
    private Boolean booleanClassField = false;
    private String stringField = "Hello World!";
    private String nullField;

    public static YamlUtilsTestHelper newInstance(int intField, float floatField,
        double doubleField, boolean booleanField, String stringField) {
      YamlUtilsTestHelper object = new YamlUtilsTestHelper();
      object.setIntField(intField);
      object.setIntegerField(intField);
      object.setFloatField(floatField);
      object.setFloatClassField(floatField);
      object.setDoubleField(doubleField);
      object.setDoubleClassField(doubleField);
      object.setBooleanField(booleanField);
      object.setBooleanClassField(booleanField);
      object.setStringField(stringField);
      return object;
    }

    public int getIntField() {
      return intField;
    }

    public void setIntField(int intField) {
      this.intField = intField;
    }

    public Integer getIntegerField() {
      return integerField;
    }

    public void setIntegerField(Integer integerField) {
      this.integerField = integerField;
    }

    public float getFloatField() {
      return floatField;
    }

    public void setFloatField(float floatField) {
      this.floatField = floatField;
    }

    public Float getFloatClassField() {
      return floatClassField;
    }

    public void setFloatClassField(Float floatClassField) {
      this.floatClassField = floatClassField;
    }

    public double getDoubleField() {
      return doubleField;
    }

    public void setDoubleField(double doubleField) {
      this.doubleField = doubleField;
    }

    public Double getDoubleClassField() {
      return doubleClassField;
    }

    public void setDoubleClassField(Double doubleClassField) {
      this.doubleClassField = doubleClassField;
    }

    public boolean isBooleanField() {
      return booleanField;
    }

    public void setBooleanField(boolean booleanField) {
      this.booleanField = booleanField;
    }

    public Boolean getBooleanClassField() {
      return booleanClassField;
    }

    public void setBooleanClassField(Boolean booleanClassField) {
      this.booleanClassField = booleanClassField;
    }

    public String getStringField() {
      return stringField;
    }

    public void setStringField(String stringField) {
      this.stringField = stringField;
    }

    public String getNullField() {
      return nullField;
    }

    public void setNullField(String nullField) {
      this.nullField = nullField;
    }
  }

  public static class YamlUtilsTestCompatibilityHelper implements Serializable {
    private int intField = 10;
    private String stringField = "Hello Compatibility!";
    private String extraField = "Hello Extra Compatibility!";
    private String extraDefaultField = "Hello Extra Default Compatibility!";

    public static YamlUtilsTestCompatibilityHelper newInstance(int intField, String stringField, String extraField) {
      YamlUtilsTestCompatibilityHelper object = new YamlUtilsTestCompatibilityHelper();
      object.setIntField(intField);
      object.setStringField(stringField);
      object.setExtraField(extraField);
      return object;
    }

    public int getIntField() {
      return intField;
    }

    public void setIntField(int intField) {
      this.intField = intField;
    }

    public String getStringField() {
      return stringField;
    }

    public void setStringField(String stringField) {
      this.stringField = stringField;
    }

    public String getExtraField() {
      return extraField;
    }

    public void setExtraField(String extraField) {
      this.extraField = extraField;
    }

    public String getExtraDefaultField() {
      return extraDefaultField;
    }

    public void setExtraDefaultField(String extraDefaultField) {
      this.extraDefaultField = extraDefaultField;
    }
  }
}