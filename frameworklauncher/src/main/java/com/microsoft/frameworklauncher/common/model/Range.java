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

import org.apache.hadoop.yarn.util.Records;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

// Represent Integer values in Closed Range [begin, end]
public class Range implements Serializable,  Comparable<Range>{
  @Valid
  @NotNull
  private Integer begin;

  @Valid
  @NotNull
  private Integer end;

  public Integer getBegin() {
    return begin;
  }

  public void setBegin(Integer begin) {
    this.begin = begin;
  }

  public Integer getEnd() {
    return end;
  }

  public void setEnd(Integer end) {
    this.end = end;
  }

  public int compareTo(Range other) {
    if (other == null) {
      return -1;
    }
    if (getBegin() == other.getBegin() && getEnd() == other.getEnd()) {
      return 0;
    } else if (getBegin() - other.getBegin() < 0) {
      return -1;
    } else if (getBegin() - other.getBegin() == 0
        && getEnd() - other.getEnd() < 0) {
      return -1;
    } else {
      return 1;
    }
  }

  public static Range newInstance(int begin, int end) {
    Range valueRange = new Range();
    valueRange.setBegin(begin);
    valueRange.setEnd(end);
    return valueRange;
  }

  public Range clone() {
    return Range.newInstance(getBegin(), getEnd());
  }


  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (!(obj instanceof Range))
      return false;
    Range other = (Range) obj;
    if (getBegin() == other.getBegin() && getEnd() == other.getEnd()) {
      return true;
    } else {
      return false;
    }
  }

  @Override
  public String toString() {
    return String.format("[%d-%d]", begin, end);
  }
}
