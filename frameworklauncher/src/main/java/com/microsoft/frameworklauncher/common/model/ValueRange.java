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

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

// Represent Integer values in Closed Range [begin, end]
public class ValueRange implements Serializable, Comparable<ValueRange> {
  @Valid
  @NotNull
  private Integer begin;

  @Valid
  @NotNull
  private Integer end;

  public static ValueRange newInstance(int begin, int end) {
    ValueRange valueRange = new ValueRange();
    valueRange.setBegin(begin);
    valueRange.setEnd(end);
    return valueRange;
  }

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

  @Override
  public int compareTo(ValueRange other) {
    if (other == null) {
      return -1;
    }
    if (getBegin().intValue() == other.getBegin().intValue() && getEnd().intValue() == other.getEnd().intValue()) {
      return 0;
    } else if (getBegin().intValue() < other.getBegin().intValue()) {
      return -1;
    } else if (getBegin().intValue() == other.getBegin().intValue() && getEnd().intValue() < other.getEnd().intValue()) {
      return -1;
    } else {
      return 1;
    }
  }

  public ValueRange clone() {
    return ValueRange.newInstance(getBegin(), getEnd());
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (!(obj instanceof ValueRange))
      return false;
    ValueRange other = (ValueRange) obj;
    if (getBegin().intValue() == other.getBegin().intValue() && getEnd().intValue() == other.getEnd().intValue()) {
      return true;
    } else {
      return false;
    }
  }

  @Override
  public String toString() {
    return String.format("[%d-%d]", begin, end);
  }

  // Unfold the Range value to number value. i.e. Change 1-5 to format 1,2,3,4,5
  public String toDetailString(String delimiter) {
    StringBuilder sb = new StringBuilder();
    sb.append(getBegin().toString());
    for (int i = getBegin() + 1; i <= getEnd(); i++) {
      sb.append(delimiter + i);
    }
    return sb.toString();
  }
}
