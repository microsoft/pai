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

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PortUtils {
  // PortString is in format: "portLabel1:port1,port2;portLabel2:port3,port4;"
  // The dynamic ports in portsDefinitions should be able to be filled up by portRanges.
  public static String toPortString(
      List<ValueRange> portRanges, Map<String, Ports> portsDefinitions) {
    StringBuilder portString = new StringBuilder();

    if (portsDefinitions != null && !portsDefinitions.isEmpty()) {
      List<ValueRange> coalescedPortRanges = ValueRangeUtils.coalesceRangeList(portRanges);
      // Assign static ports
      List<ValueRange> staticPorts = new ArrayList();
      for (Map.Entry<String, Ports> portDefinition : portsDefinitions.entrySet()) {
        String portLabel = portDefinition.getKey();
        Ports ports = portDefinition.getValue();
        // If defined static ports, directly use it, and remove the static ports from all ports list
        if (ports.getCount() > 0 && ports.getStart() != 0) {
          portString.append(portLabel).append(":").append(ports.getStart());
          for (int i = 1; i < ports.getCount(); i++) {
            portString.append(",").append(ports.getStart() + i);
          }
          portString.append(";");
          ValueRange newRange = ValueRange.newInstance(ports.getStart(), ports.getStart() + ports.getCount() - 1);
          staticPorts.add(newRange);
        }
      }
      coalescedPortRanges = ValueRangeUtils.subtractRange(coalescedPortRanges, staticPorts);

      // Assign dynamic ports.
      for (Map.Entry<String, Ports> portDefinition : portsDefinitions.entrySet()) {
        String portLabel = portDefinition.getKey();
        Ports ports = portDefinition.getValue();
        if (ports.getCount() > 0 && ports.getStart() == 0) {
          // If defined dynamic ports, assign portRanges for it.
          // Need to assign in a fixed way, such as sequentially, in case samePortAllocation specified.
          List<ValueRange> assignedPortRanges = ValueRangeUtils.getSubRangeSequentially(
              coalescedPortRanges, ports.getCount(), 0);
          coalescedPortRanges = ValueRangeUtils.subtractRange(coalescedPortRanges, assignedPortRanges);

          assert (ValueRangeUtils.getValueNumber(assignedPortRanges) == ports.getCount());
          portString.append(portLabel).append(":").append(assignedPortRanges.get(0).toDetailedString(","));
          for (int i = 1; i < assignedPortRanges.size(); i++) {
            portString.append(",").append(assignedPortRanges.get(i).toDetailedString(","));
          }
          portString.append(";");
        }
      }
    }

    return portString.toString();
  }

  // PortString is in format: "portLabel1:port1,port2;portLabel2:port3,port4;"
  public static List<ValueRange> toPortRanges(String portString) {
    List<ValueRange> portRanges = new ArrayList<>();
    if (portString != null && !portString.isEmpty()) {
      Pattern portPattern = Pattern.compile("[0-9]+");
      Matcher portMatcher = portPattern.matcher(portString);
      while (portMatcher.find()) {
        Integer port = Integer.parseInt(portMatcher.group());
        portRanges.add(ValueRange.newInstance(port, port));
      }
    }
    return ValueRangeUtils.coalesceRangeList(portRanges);
  }

  // May be called before validation, so need to check preconditions
  public static List<ValueRange> getStaticPortRanges(Map<String, Ports> portDefinitions) {
    List<ValueRange> staticPortRanges = new ArrayList<>();
    for (Ports ports : portDefinitions.values()) {
      if (ports != null &&
          ports.getStart() != null && ports.getStart() != 0 &&
          ports.getCount() != null && ports.getCount() > 0) {
        staticPortRanges.add(ValueRange.newInstance(
            ports.getStart(), ports.getStart() + ports.getCount() - 1));
      }
    }
    return ValueRangeUtils.coalesceRangeList(staticPortRanges);
  }

  // May be called before validation, so need to check preconditions
  public static int getDynamicPortNumber(Map<String, Ports> portDefinitions) {
    int dynamicPortNumber = 0;
    for (Ports ports : portDefinitions.values()) {
      if (ports != null &&
          ports.getStart() != null && ports.getStart() == 0 &&
          ports.getCount() != null && ports.getCount() > 0) {
        dynamicPortNumber += ports.getCount();
      }
    }
    return dynamicPortNumber;
  }
}
