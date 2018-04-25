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

import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.model.Ports;
import com.microsoft.frameworklauncher.common.model.ValueRange;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ValueRangeUtils {

  /*
    sort the list range from small to big.
   */
  public static List<ValueRange> SortRangeList(List<ValueRange> ranges) {
    List<ValueRange> newList = cloneList(ranges);
    Collections.sort(newList);
    return newList;
  }

  /*
    count the value number in a  range list.
   */
  public static int getValueNumber(List<ValueRange> rangeList) {
    if (rangeList == null || rangeList.size() == 0) {
      return 0;
    }

    List<ValueRange> newRangeList = coalesceRangeList(rangeList);
    int valueCount = 0;
    for (ValueRange range : newRangeList) {
      valueCount += (range.getEnd() - range.getBegin() + 1);
    }
    return valueCount;
  }

  /*
    coalesce the duplicate or overlap range in the range list.
   */
  public static List<ValueRange> coalesceRangeList(List<ValueRange> rangeList) {
    if (rangeList == null || rangeList.isEmpty()) {
      return rangeList;
    }

    List<ValueRange> sortedList = SortRangeList(rangeList);
    List<ValueRange> resultList = new ArrayList<ValueRange>();

    ValueRange current = sortedList.get(0).clone();
    resultList.add(current);

    for (ValueRange range : sortedList) {
      // Skip if this range is equivalent to the current range.
      if (range.getBegin().intValue() == current.getBegin().intValue()
          && range.getEnd().intValue() == current.getEnd().intValue()) {
        continue;
      }
      // If the current range just needs to be extended on the right.
      if (range.getBegin().intValue() == current.getBegin().intValue()
          && range.getEnd() > current.getEnd()) {
        current.setEnd(range.getEnd());
      } else if (range.getBegin() > current.getBegin()) {
        // If we are starting farther ahead, then there are 2 cases:
        if (range.getBegin() <= current.getEnd() + 1) {
          // 1. Ranges are overlapping and we can merge them.
          current.setEnd(Math.max(current.getEnd(), range.getEnd()));
        } else {
          // 2. No overlap and we are adding a new range.
          current = range.clone();
          resultList.add(current);
        }
      }
    }
    return resultList;
  }

  /*
    get the overlap part of tow range lists
   */
  public static List<ValueRange> intersectRangeList(List<ValueRange> leftRange, List<ValueRange> rightRange) {

    if (leftRange == null || rightRange == null) {
      return null;
    }

    List<ValueRange> leftList = coalesceRangeList(leftRange);
    List<ValueRange> rightList = coalesceRangeList(rightRange);

    List<ValueRange> result = new ArrayList<ValueRange>();
    int i = 0;
    int j = 0;
    while (i < leftList.size() && j < rightList.size()) {
      ValueRange left = leftList.get(i);
      ValueRange right = rightList.get(j);
      // 1. no overlap, right is bigger than left
      if (left.getEnd() < right.getBegin()) {
        i++;
        // 2. no overlap, left is bigger than right
      } else if (right.getEnd() < left.getBegin()) {
        j++;
        // 3. has overlap, get the overlap
      } else {
        result.add(ValueRange.newInstance(Math.max(left.getBegin(), right.getBegin()), Math.min(left.getEnd(), right.getEnd())));
        if (left.getEnd() < right.getEnd()) {
          i++;
        } else {
          j++;
        }
      }
    }
    return result;
  }

  /*
    delete the overlap part from leftRange.
   */
  public static List<ValueRange> subtractRange(List<ValueRange> leftRange, List<ValueRange> rightRange) {

    if (leftRange == null || rightRange == null) {
      return leftRange;
    }

    List<ValueRange> result = coalesceRangeList(leftRange);
    List<ValueRange> rightList = coalesceRangeList(rightRange);

    int i = 0;
    int j = 0;
    while (i < result.size() && j < rightList.size()) {
      ValueRange left = result.get(i);
      ValueRange right = rightList.get(j);
      // 1. no overlap, right is bigger than left
      if (left.getEnd() < right.getBegin()) {
        i++;
        // 2. no overlap, left is bigger than right
      } else if (right.getEnd() < left.getBegin()) {
        j++;
        // 3. has overlap, left is less than right
      } else {
        if (left.getBegin() < right.getBegin()) {
          //3.1 Left start earlier than right, cut at the right begin;
          if (left.getEnd() <= right.getEnd()) {
            //3.1.1 Left end earlier than right, do nothing, try next left;
            left.setEnd(right.getBegin() - 1);
            i++;
          } else {
            //3.1.2 Left end later than right, create a new range in left;
            ValueRange newRange = ValueRange.newInstance(right.getEnd() + 1, left.getEnd());
            result.add(i + 1, newRange);
            left.setEnd(right.getBegin() - 1);
            j++;
          }
        } else {
          // 3.2 left start later than right
          if (left.getEnd() <= right.getEnd()) {
            //3.2.1 left end earlier than right, just remove the left
            result.remove(i);
          } else {
            //3.2.2 left end later than right, just remove left
            left.setBegin(right.getEnd() + 1);
            j++;
          }
        }
      }
    }
    return result;
  }

  /*
    add rightRange to leftRange, will ingore the overlap range.
   */
  public static List<ValueRange> addRange(List<ValueRange> leftRange, List<ValueRange> rightRange) {

    if (leftRange == null)
      return rightRange;
    if (rightRange == null)
      return leftRange;

    List<ValueRange> result = coalesceRangeList(leftRange);
    result.addAll(rightRange);
    return coalesceRangeList(result);
  }

  /*
    verify if the bigRange include the small range
   */
  public static boolean fitInRange(List<ValueRange> smallRange, List<ValueRange> bigRange) {
    if (smallRange == null) {
      return true;
    }

    if (bigRange == null) {
      return false;
    }

    List<ValueRange> result = coalesceRangeList(bigRange);
    List<ValueRange> smallRangeList = coalesceRangeList(smallRange);
    int i = 0;
    int j = 0;
    while (i < result.size() && j < smallRangeList.size()) {
      ValueRange big = result.get(i);
      ValueRange small = smallRangeList.get(j);

      if (small.getBegin() < big.getBegin()) {
        return false;
      }

      if (small.getBegin() <= big.getEnd()) {
        if (small.getEnd() > big.getEnd()) {
          return false;
        } else {
          big.setBegin(small.getEnd() + 1);
          j++;
        }
      } else {
        i++;
      }
    }
    return (j >= smallRangeList.size());
  }

  /*
    get a random subRange list from the available range list, all the values in the subRange are bigger than baseValue.
   */
  public static List<ValueRange> getSubRangeRandomly(List<ValueRange> availableRange, int requestNumber, int baseValue) {

    List<ValueRange> resultList = new ArrayList<ValueRange>();
    if (getValueNumber(availableRange) <= 0) {
      return resultList;
    }
    Random random = new Random();
    //Pick a random number from 0 to the max value;
    int maxValue = availableRange.get(availableRange.size() - 1).getEnd();
    int randomBase = random.nextInt(maxValue) + 1;

    // try different randomBase to find enough request number. If still cannot find enough request
    // number when randomBase reduce to 0, return empty set.
    while (randomBase > 0) {
      resultList.clear();
      int needNumber = requestNumber;
      randomBase = randomBase / 2;
      int newBaseValue = baseValue + randomBase;
      for (ValueRange range : availableRange) {
        if (range.getEnd() < newBaseValue) {
          continue;
        }
        int start = Math.max(range.getBegin(), newBaseValue);
        if ((range.getEnd() - start + 1) >= needNumber) {
          resultList.add(ValueRange.newInstance(start, start + needNumber - 1));
          return resultList;
        } else {
          resultList.add(ValueRange.newInstance(start, range.getEnd()));
          needNumber -= (range.getEnd() - start + 1);
        }
      }
    }
    return resultList;
  }

  /*
  get a sequential subRange list from the available range list, all the values in the subRange are bigger than baseValue.
 */
  public static List<ValueRange> getSubRangeSequentially(List<ValueRange> availableRange, int requestNumber, int baseValue) {

    List<ValueRange> resultList = new ArrayList<ValueRange>();
    if (getValueNumber(availableRange) <= 0) {
      return resultList;
    }

    resultList.clear();
    int needNumber = requestNumber;

    int newBaseValue = baseValue;
    for (ValueRange range : availableRange) {
      if (range.getEnd() < newBaseValue) {
        continue;
      }
      int start = Math.max(range.getBegin(), newBaseValue);
      if ((range.getEnd() - start + 1) >= needNumber) {
        resultList.add(ValueRange.newInstance(start, start + needNumber - 1));
        return resultList;
      } else {
        resultList.add(ValueRange.newInstance(start, range.getEnd()));
        needNumber -= (range.getEnd() - start + 1);
      }
    }

    return resultList;
  }

  public static boolean isEqualRangeList(List<ValueRange> leftRangeList, List<ValueRange> rightRangeList) {
    List<ValueRange> leftRange = coalesceRangeList(leftRangeList);
    List<ValueRange> rightRange = coalesceRangeList(rightRangeList);

    if (leftRange == null || rightRange == null) {
      if (leftRange == rightRange) {
        return true;
      } else {
        return false;
      }
    }
    if (leftRange.size() != rightRange.size()) {
      return false;
    }
    for (int i = 0; i < leftRange.size(); i++) {
      if (leftRange.get(i).getBegin().intValue() != rightRange.get(i).getBegin().intValue()) {
        return false;
      }
      if (leftRange.get(i).getEnd().intValue() != rightRange.get(i).getEnd().intValue()) {
        return false;
      }
    }
    return true;
  }

  public static List<ValueRange> cloneList(List<ValueRange> list) {
    List<ValueRange> newList = new ArrayList<ValueRange>();
    for (ValueRange range : list) {
      newList.add(range.clone());
    }
    return newList;
  }

  /*
    get the value at "index" location in the Range list
   */
  public static Integer getValue(List<ValueRange> list, int index) {
    if (list == null) {
      return -1;
    }
    List<ValueRange> ranges = coalesceRangeList(list);
    int i = index;
    for (ValueRange range : ranges) {
      if (range.getEnd() - range.getBegin() < i) {
        i -= (range.getEnd() - range.getBegin() + 1);
      } else {
        return (range.getBegin() + i);
      }
    }
    return -1;
  }

  public static String toString(List<ValueRange> valueList) {
    StringBuilder portString = new StringBuilder();
    if (valueList != null) {
      for (ValueRange range : valueList) {
        portString.append(range);
      }
    }
    return portString.toString();
  }

  // This function is to convert port from List<ValueRange> format to string format
  // The string format is "httpPort:80,81,82;sshPort:1021,1022,1023;"
  // the Ports label defined in portsDefinitions

  public static String convertPortRangeToPortDefinitionsString(List<ValueRange> portRanges, Map<String, Ports> portsDefinitions) throws Exception {
    StringBuilder portsString = new StringBuilder();

    if (portsDefinitions != null && !portsDefinitions.isEmpty()) {
      Iterator iter = portsDefinitions.entrySet().iterator();

      List<ValueRange> localPortRanges = ValueRangeUtils.coalesceRangeList(portRanges);
      while (iter.hasNext()) {
        Map.Entry entry = (Map.Entry) iter.next();
        String key = (String) entry.getKey();
        Ports ports = (Ports) entry.getValue();
        //if user specified ports, directly use the PortDefinitions in request.
        if (ports.getStart() > 0) {
          portsString.append(key + ":" + ports.getStart());
          for (int i = 2; i <= ports.getCount(); i++) {
            portsString.append("," + (ports.getStart() + i - 1));
          }
          portsString.append(";");
        } else {
          //if user not specified ports, assign the allocated ContainerPorts to each port label.
          List<ValueRange> assignPorts = ValueRangeUtils.getSubRangeSequentially(localPortRanges, ports.getCount(), 0);
          if (getValueNumber(assignPorts) == ports.getCount()) {
            localPortRanges = ValueRangeUtils.subtractRange(localPortRanges, assignPorts);

            portsString.append(key + ":" + assignPorts.get(0).toDetailString(","));
            for (int i = 1; i < assignPorts.size(); i++) {
              portsString.append("," + assignPorts.get(i).toDetailString(","));
            }
            portsString.append(";");
          } else {
            throw new NotAvailableException("there is no enough ports to meet portsDefinitions requests");
          }
        }
      }
    }
    return portsString.toString();
  }

  // The string format is "httpPort:80,81,82;sshPort:1021,1022,1023;"
  public static List<ValueRange> convertPortDefinitionsStringToPortRange(String portDefinitions) {
    if (portDefinitions != null && !portDefinitions.isEmpty()) {
      Pattern pattern = Pattern.compile("[0-9]+");
      List<ValueRange> resultList = new ArrayList<>();

      Matcher portNum = pattern.matcher(portDefinitions);
      while (portNum.find()) {
        Integer port = Integer.parseInt(portNum.group());
        resultList.add(ValueRange.newInstance(port, port));
      }
      return ValueRangeUtils.coalesceRangeList(resultList);
    } else {
      return new ArrayList<ValueRange>();
    }
  }
}
