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

import com.microsoft.frameworklauncher.common.model.*;

import java.net.PortUnreachableException;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

public class PortRangeUtils {

  /*
    sort the list range from small to big.
   */
  public static List<Range> SortRangeList(List<Range> ranges) {
    List<Range> newList = cloneList(ranges);
    Collections.sort(newList);
    return newList;
  }

  /*
    count the ports number in a port range list.
   */
  public static int getPortsNumber(List<Range> rangeList) {
    if (rangeList == null || rangeList.size() == 0) {
      return 0;
    }

    List<Range> newRangeList = coalesceRangeList(rangeList);
    int portCount = 0;
    for (Range range : newRangeList) {
      portCount += (range.getEnd() - range.getBegin() + 1);
    }
    return portCount;
  }

  /*
    coalesce the duplicate or overlap range in the rangelist.
   */
  public static List<Range> coalesceRangeList(List<Range> rangeList) {
    if (rangeList == null || rangeList.isEmpty()) {
      return rangeList;
    }

    List<Range> sortedList = PortRangeUtils.SortRangeList(rangeList);
    List<Range> resultList = new ArrayList<Range>();

    Range current = sortedList.get(0).clone();
    resultList.add(current);

    for (Range range : sortedList) {
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
    get the overlap part of tow range list
   */
  public static List<Range> intersectRangeList(List<Range> leftRange, List<Range> rightRange) {

    if (leftRange == null || rightRange == null) {
      return null;
    }

    List<Range> leftList = coalesceRangeList(leftRange);
    List<Range> rightList = coalesceRangeList(rightRange);

    List<Range> result = new ArrayList<Range>();
    int i = 0;
    int j = 0;
    while (i < leftList.size() && j < rightList.size()) {
      Range left = leftList.get(i);
      Range right = rightList.get(j);
      // 1. no overlap, right is bigger than left
      if (left.getEnd() < right.getBegin()) {
        i++;
        // 2. no overlap, left is bigger than right
      } else if (right.getEnd() < left.getBegin()) {
        j++;
        // 3. has overlap, get the overlap
      } else {
        result.add(Range.newInstance(Math.max(left.getBegin(), right.getBegin()), Math.min(left.getEnd(), right.getEnd())));
        if (left.getEnd() < right.getEnd()) {
          i++;
        } else {
          j++;
        }
      }
    }
    return result;
  }

  public static List<Range> subtractRange(List<Range> leftRange, List<Range> rightRange) {

    if (leftRange == null || rightRange == null) {
      return leftRange;
    }

    List<Range> result = PortRangeUtils.coalesceRangeList(leftRange);
    List<Range> rightList = PortRangeUtils.coalesceRangeList(rightRange);

    int i = 0;
    int j = 0;
    while (i < result.size() && j < rightList.size()) {
      Range left = result.get(i);
      Range right = rightList.get(j);
      // 1. no overlap, right is bigger than left
      if (left.getEnd() < right.getBegin()) {
        i++;
        // 2. no overlap, left is bigger than right
      } else if (right.getEnd() < left.getBegin()) {
        j++;
        // 3. has overlap, left is less than right
      } else {
        if (left.getBegin() < right.getBegin()) {
          //3.1 Left start early than right, cut at the right begin;
          if (left.getEnd() <= right.getEnd()) {
            //3.1.1 Left end early than right, do nothing try next left;
            left.setEnd(right.getBegin() - 1);
            i++;
          } else {
            //3.1.2 Left end later than right, create a new range in left;
            Range newRange = Range.newInstance(right.getEnd() + 1, left.getEnd());
            result.add(i + 1, newRange);
            left.setEnd(right.getBegin() - 1);
            j++;
          }
        } else {
          // 3.2 left start later than right
          if (left.getEnd() <= right.getEnd()) {
            //3.2.1 left end early than right, just remove left
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

  public static List<Range> addRange(List<Range> leftRange, List<Range> rightRange) {

    if (leftRange == null)
      return rightRange;
    if (rightRange == null)
      return leftRange;

    List<Range> result = coalesceRangeList(leftRange);
    result.addAll(rightRange);
    return coalesceRangeList(result);
  }

  public static boolean fitInRange(List<Range> smallRange, List<Range> bigRange) {
    if (smallRange == null) {
      return true;
    }

    if (bigRange == null) {
      return false;
    }

    List<Range> result = coalesceRangeList(bigRange);
    List<Range> smallRangeList = coalesceRangeList(smallRange);
    int i = 0;
    int j = 0;
    while (i < result.size() && j < smallRangeList.size()) {
      Range big = result.get(i);
      Range small = smallRangeList.get(j);

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

  public static List<Range> getCandidatePorts(List<Range> availablePorts, int portsCount, int basePort) {

    List<Range> resultList = new ArrayList<Range>();
    int needAllocatePort = portsCount;
    int start = basePort;
    for (Range range : availablePorts) {

      if (range.getEnd() < basePort) {
        continue;
      }
      start = Math.max(range.getBegin(), basePort);
      if ((range.getEnd() - start + 1) >= needAllocatePort) {
        resultList.add(Range.newInstance(start, start + needAllocatePort - 1));
        return resultList;
      } else {
        resultList.add(Range.newInstance(start, range.getEnd()));
        needAllocatePort -= (range.getEnd() - start + 1);
      }
    }
    return null;
  }

  public static List<Range> cloneList(List<Range> list) {
    List<Range> newList = new ArrayList<Range>();
    for (Range range : list) {
      newList.add(range.clone());
    }
    return newList;
  }
}
