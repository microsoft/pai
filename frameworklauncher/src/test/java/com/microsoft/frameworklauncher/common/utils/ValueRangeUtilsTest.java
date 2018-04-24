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

import com.microsoft.frameworklauncher.common.model.Ports;
import com.microsoft.frameworklauncher.common.model.ValueRange;
import org.junit.Assert;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ValueRangeUtilsTest {

  @Test
  public void ValueRangeUtilsTest() throws Exception {
    List<ValueRange> testRangeList = new ArrayList<ValueRange>();
    testRangeList.add(ValueRange.newInstance(6, 7));
    testRangeList.add(ValueRange.newInstance(10, 100));
    testRangeList.add(ValueRange.newInstance(3, 5));
    testRangeList.add(ValueRange.newInstance(90, 102));

    List<ValueRange> testRangeList2 = new ArrayList<ValueRange>();
    testRangeList2.add(ValueRange.newInstance(2, 3));
    testRangeList2.add(ValueRange.newInstance(7, 8));
    testRangeList2.add(ValueRange.newInstance(10, 20));

    for (int j = 0; j < 20; j++) {
      List<ValueRange> testRangeList3 = ValueRangeUtils.cloneList(testRangeList2);

      List<ValueRange> sortedResult = ValueRangeUtils.SortRangeList(testRangeList);
      Assert.assertEquals(3, sortedResult.get(0).getBegin().intValue());
      Assert.assertEquals(6, sortedResult.get(1).getBegin().intValue());
      Assert.assertEquals(10, sortedResult.get(2).getBegin().intValue());
      Assert.assertEquals(90, sortedResult.get(3).getBegin().intValue());


      List<ValueRange> coalesceResult = ValueRangeUtils.coalesceRangeList(testRangeList);
      Assert.assertEquals(2, coalesceResult.size());
      Assert.assertEquals(3, coalesceResult.get(0).getBegin().intValue());
      Assert.assertEquals(7, coalesceResult.get(0).getEnd().intValue());
      Assert.assertEquals(10, coalesceResult.get(1).getBegin().intValue());
      Assert.assertEquals(102, coalesceResult.get(1).getEnd().intValue());

      List<ValueRange> result = ValueRangeUtils.intersectRangeList(coalesceResult, testRangeList2);
      Assert.assertEquals(3, result.size());
      Assert.assertEquals(3, result.get(0).getBegin().intValue());
      Assert.assertEquals(3, result.get(0).getEnd().intValue());
      Assert.assertEquals(7, result.get(1).getBegin().intValue());
      Assert.assertEquals(7, result.get(1).getEnd().intValue());
      Assert.assertEquals(10, result.get(2).getBegin().intValue());
      Assert.assertEquals(20, result.get(2).getEnd().intValue());

      result = ValueRangeUtils.subtractRange(coalesceResult, testRangeList2);
      Assert.assertEquals(2, result.size());
      Assert.assertEquals(4, result.get(0).getBegin().intValue());
      Assert.assertEquals(6, result.get(0).getEnd().intValue());
      Assert.assertEquals(21, result.get(1).getBegin().intValue());
      Assert.assertEquals(102, result.get(1).getEnd().intValue());


      List<ValueRange> testRangeList7 = new ArrayList<ValueRange>();
      testRangeList7.add(ValueRange.newInstance(80, 80));
      result = ValueRangeUtils.subtractRange(coalesceResult, testRangeList7);
      Assert.assertEquals(3, result.size());
      Assert.assertEquals(3, result.get(0).getBegin().intValue());
      Assert.assertEquals(7, result.get(0).getEnd().intValue());
      Assert.assertEquals(10, result.get(1).getBegin().intValue());
      Assert.assertEquals(79, result.get(1).getEnd().intValue());
      Assert.assertEquals(81, result.get(2).getBegin().intValue());
      Assert.assertEquals(102, result.get(2).getEnd().intValue());


      result = ValueRangeUtils.addRange(sortedResult, testRangeList2);
      Assert.assertEquals(2, result.size());
      Assert.assertEquals(2, result.get(0).getBegin().intValue());
      Assert.assertEquals(8, result.get(0).getEnd().intValue());
      Assert.assertEquals(10, result.get(1).getBegin().intValue());
      Assert.assertEquals(102, result.get(1).getEnd().intValue());


      List<ValueRange> testRangeList4 = new ArrayList<ValueRange>();
      testRangeList4.add(ValueRange.newInstance(2, 3));
      Assert.assertTrue(ValueRangeUtils.fitInRange(testRangeList4, testRangeList3));

      List<ValueRange> testRangeList5 = new ArrayList<ValueRange>();
      testRangeList5.add(ValueRange.newInstance(1, 3));
      Assert.assertTrue(!ValueRangeUtils.fitInRange(testRangeList5, testRangeList3));

      List<ValueRange> testRangeList6 = new ArrayList<ValueRange>();
      testRangeList6.add(ValueRange.newInstance(9, 9));
      Assert.assertTrue(!ValueRangeUtils.fitInRange(testRangeList6, testRangeList3));

      result = ValueRangeUtils.getSubRangeRandomly(testRangeList3, 1, 0);
      Assert.assertEquals(1, result.size());
      Assert.assertEquals(1, ValueRangeUtils.getValueNumber(result));

      result = ValueRangeUtils.getSubRangeRandomly(testRangeList3, 3, 0);
      Assert.assertEquals(3, ValueRangeUtils.getValueNumber(result));

      result = ValueRangeUtils.getSubRangeRandomly(testRangeList3, 3, 10);
      Assert.assertEquals(3, ValueRangeUtils.getValueNumber(result));
      Assert.assertTrue(result.get(0).getBegin() >= 10);
      Assert.assertTrue(result.get(0).getEnd() > 10);

      List<ValueRange> testRangeList10 = new ArrayList<ValueRange>();
      testRangeList10.add(ValueRange.newInstance(80, 80));
      testRangeList10.add(ValueRange.newInstance(80, 81));
      testRangeList10.add(ValueRange.newInstance(100, 103));
      int[] expectedResult = {80, 81, 100, 101, 102, 103};
      for (int i = 0; i < ValueRangeUtils.getValueNumber(testRangeList10); i++) {
        Assert.assertEquals(expectedResult[i], ValueRangeUtils.getValue(testRangeList10, i).intValue());
      }

      Map<String, Ports> portDefinitions = new HashMap<String, Ports>();
      Ports ports1 = new Ports();
      ports1.setCount(2);
      ports1.setStart(40);
      portDefinitions.put("http_Port", ports1);
      Ports ports2 = new Ports();
      ports2.setCount(4);
      ports2.setStart(9000);
      portDefinitions.put("http_SSH", ports2);

      List<ValueRange> testValueRange = new ArrayList<ValueRange>();
      testValueRange.add(ValueRange.newInstance(40, 41));
      List<ValueRange> testValueRange2 = new ArrayList<ValueRange>();
      testValueRange.add(ValueRange.newInstance(9000, 9003));
      String environmentString = ValueRangeUtils.convertPortRangeToPortDefinitionsString(testValueRange, portDefinitions);
      Assert.assertEquals(environmentString, "http_SSH:9000,9001,9002,9003;http_Port:40,41;");

      Map<String, Ports> portDefinitions2 = new HashMap<String, Ports>();
      Ports ports3 = new Ports();
      ports3.setCount(2);
      ports3.setStart(0);
      portDefinitions2.put("http_Port", ports3);
      Ports ports4 = new Ports();
      ports4.setCount(4);
      ports4.setStart(0);
      portDefinitions2.put("http_SSH", ports4);

      environmentString = ValueRangeUtils.convertPortRangeToPortDefinitionsString(testValueRange, portDefinitions2);

      Assert.assertEquals(environmentString.split(";").length, 2);
      Assert.assertEquals(environmentString.split(",").length, 5);

      List<ValueRange> valueRangeResult = ValueRangeUtils.convertPortDefinitionsStringToPortRange(environmentString);
      Assert.assertEquals(testValueRange.size(), valueRangeResult.size());
      Assert.assertEquals(testValueRange.get(0).getBegin(), valueRangeResult.get(0).getBegin());
      Assert.assertEquals(testValueRange.get(0).getEnd(), valueRangeResult.get(0).getEnd());
      Assert.assertEquals(testValueRange.get(1).getBegin(), valueRangeResult.get(1).getBegin());
      Assert.assertEquals(testValueRange.get(1).getEnd(), valueRangeResult.get(1).getEnd());

    }
  }
}


