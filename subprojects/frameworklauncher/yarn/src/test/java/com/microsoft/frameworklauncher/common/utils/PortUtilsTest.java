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

public class PortUtilsTest {
  @Test
  public void testPortUtils() throws Exception {
    //Test PortUtils for user specific ports.
    Map<String, Ports> portDefinitions = new HashMap<>();
    Ports ports1 = new Ports();
    ports1.setCount(2);
    ports1.setStart(40);
    portDefinitions.put("http_Port", ports1);
    Ports ports2 = new Ports();
    ports2.setCount(4);
    ports2.setStart(9000);
    portDefinitions.put("http_SSH", ports2);

    List<ValueRange> testValueRange = new ArrayList<>();
    testValueRange.add(ValueRange.newInstance(40, 41));
    testValueRange.add(ValueRange.newInstance(9000, 9003));
    String portString = PortUtils.toPortString(testValueRange, portDefinitions);
    Assert.assertEquals(portString, "http_SSH:9000,9001,9002,9003;http_Port:40,41;");

    // Test PortUtils for random ports.
    Map<String, Ports> portDefinitions2 = new HashMap<>();
    Ports ports3 = new Ports();
    ports3.setCount(2);
    ports3.setStart(0);
    portDefinitions2.put("http_Port", ports3);
    Ports ports4 = new Ports();
    ports4.setCount(4);
    ports4.setStart(0);
    portDefinitions2.put("http_SSH", ports4);

    portString = PortUtils.toPortString(testValueRange, portDefinitions2);

    Assert.assertEquals(portString.split(";").length, 2);
    Assert.assertEquals(portString.split(",").length, 5);

    List<ValueRange> valueRangeResult = PortUtils.toPortRanges(portString);
    Assert.assertEquals(testValueRange.size(), valueRangeResult.size());
    Assert.assertEquals(testValueRange.get(0).getBegin(), valueRangeResult.get(0).getBegin());
    Assert.assertEquals(testValueRange.get(0).getEnd(), valueRangeResult.get(0).getEnd());
    Assert.assertEquals(testValueRange.get(1).getBegin(), valueRangeResult.get(1).getBegin());
    Assert.assertEquals(testValueRange.get(1).getEnd(), valueRangeResult.get(1).getEnd());

    // Test PortUtils for random ports and user specific ports 1#.
    Map<String, Ports> portDefinitions3 = new HashMap<>();

    portDefinitions3.put("http_Port", ports1);
    portDefinitions3.put("http_SSH", ports4);

    portString = PortUtils.toPortString(testValueRange, portDefinitions3);
    Assert.assertEquals(portString.split(";").length, 2);
    Assert.assertEquals(portString.split(",").length, 5);
    Assert.assertEquals(portString, "http_Port:40,41;http_SSH:9000,9001,9002,9003;");

    valueRangeResult = PortUtils.toPortRanges(portString);
    Assert.assertEquals(testValueRange.size(), valueRangeResult.size());
    Assert.assertEquals(testValueRange.get(0).getBegin(), valueRangeResult.get(0).getBegin());
    Assert.assertEquals(testValueRange.get(0).getEnd(), valueRangeResult.get(0).getEnd());
    Assert.assertEquals(testValueRange.get(1).getBegin(), valueRangeResult.get(1).getBegin());
    Assert.assertEquals(testValueRange.get(1).getEnd(), valueRangeResult.get(1).getEnd());

    // Test PortUtils for random ports and user specific ports 2#.
    Map<String, Ports> portDefinitions4 = new HashMap<>();

    portDefinitions4.put("http_Port", ports2);
    portDefinitions4.put("http_SSH", ports3);

    portString = PortUtils.toPortString(testValueRange, portDefinitions4);
    Assert.assertEquals(portString.split(";").length, 2);
    Assert.assertEquals(portString.split(",").length, 5);
    Assert.assertEquals(portString, "http_Port:9000,9001,9002,9003;http_SSH:40,41;");

    valueRangeResult = PortUtils.toPortRanges(portString);
    Assert.assertEquals(testValueRange.size(), valueRangeResult.size());
    Assert.assertEquals(testValueRange.get(0).getBegin(), valueRangeResult.get(0).getBegin());
    Assert.assertEquals(testValueRange.get(0).getEnd(), valueRangeResult.get(0).getEnd());
    Assert.assertEquals(testValueRange.get(1).getBegin(), valueRangeResult.get(1).getBegin());
    Assert.assertEquals(testValueRange.get(1).getEnd(), valueRangeResult.get(1).getEnd());

    // Test PortUtils for random ports and user specific ports 3#.
    Map<String, Ports> portDefinitions5 = new HashMap<>();
    portDefinitions5.put("http_Port", ports3);
    portDefinitions5.put("http_SSH", ports2);
    portString = PortUtils.toPortString(testValueRange, portDefinitions5);
    Assert.assertEquals(portString.split(";").length, 2);
    Assert.assertEquals(portString.split(",").length, 5);
    Assert.assertEquals(portString, "http_SSH:9000,9001,9002,9003;http_Port:40,41;");

    valueRangeResult = PortUtils.toPortRanges(portString);
    Assert.assertEquals(testValueRange.size(), valueRangeResult.size());
    Assert.assertEquals(testValueRange.get(0).getBegin(), valueRangeResult.get(0).getBegin());
    Assert.assertEquals(testValueRange.get(0).getEnd(), valueRangeResult.get(0).getEnd());
    Assert.assertEquals(testValueRange.get(1).getBegin(), valueRangeResult.get(1).getBegin());
    Assert.assertEquals(testValueRange.get(1).getEnd(), valueRangeResult.get(1).getEnd());
  }
}


