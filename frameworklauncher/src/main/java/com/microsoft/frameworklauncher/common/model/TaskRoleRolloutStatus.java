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

import java.io.Serializable;
import java.util.List;

public class TaskRoleRolloutStatus implements Serializable {
  private Integer overallRolloutServiceVersion;
  private RolloutStatus overallRolloutStatus = RolloutStatus.UNKNOWN;
  private Integer overallRolloutStartTimestamp;
  private Integer overallRolloutEndTimestamp;

  private Integer currentRolloutScaleUnit;
  private List<Integer> currentRolloutTaskIndexes;
  private RolloutStatus currentRolloutStatus = RolloutStatus.UNKNOWN;
  private Integer currentRolloutStartTimestamp;
  private Integer currentRolloutEndTimestamp;

  public Integer getOverallRolloutServiceVersion() {
    return overallRolloutServiceVersion;
  }

  public void setOverallRolloutServiceVersion(Integer overallRolloutServiceVersion) {
    this.overallRolloutServiceVersion = overallRolloutServiceVersion;
  }

  public RolloutStatus getOverallRolloutStatus() {
    return overallRolloutStatus;
  }

  public void setOverallRolloutStatus(RolloutStatus overallRolloutStatus) {
    this.overallRolloutStatus = overallRolloutStatus;
  }

  public Integer getOverallRolloutStartTimestamp() {
    return overallRolloutStartTimestamp;
  }

  public void setOverallRolloutStartTimestamp(Integer overallRolloutStartTimestamp) {
    this.overallRolloutStartTimestamp = overallRolloutStartTimestamp;
  }

  public Integer getOverallRolloutEndTimestamp() {
    return overallRolloutEndTimestamp;
  }

  public void setOverallRolloutEndTimestamp(Integer overallRolloutEndTimestamp) {
    this.overallRolloutEndTimestamp = overallRolloutEndTimestamp;
  }

  public Integer getCurrentRolloutScaleUnit() {
    return currentRolloutScaleUnit;
  }

  public void setCurrentRolloutScaleUnit(Integer currentRolloutScaleUnit) {
    this.currentRolloutScaleUnit = currentRolloutScaleUnit;
  }

  public List<Integer> getCurrentRolloutTaskIndexes() {
    return currentRolloutTaskIndexes;
  }

  public void setCurrentRolloutTaskIndexes(List<Integer> currentRolloutTaskIndexes) {
    this.currentRolloutTaskIndexes = currentRolloutTaskIndexes;
  }

  public RolloutStatus getCurrentRolloutStatus() {
    return currentRolloutStatus;
  }

  public void setCurrentRolloutStatus(RolloutStatus currentRolloutStatus) {
    this.currentRolloutStatus = currentRolloutStatus;
  }

  public Integer getCurrentRolloutStartTimestamp() {
    return currentRolloutStartTimestamp;
  }

  public void setCurrentRolloutStartTimestamp(Integer currentRolloutStartTimestamp) {
    this.currentRolloutStartTimestamp = currentRolloutStartTimestamp;
  }

  public Integer getCurrentRolloutEndTimestamp() {
    return currentRolloutEndTimestamp;
  }

  public void setCurrentRolloutEndTimestamp(Integer currentRolloutEndTimestamp) {
    this.currentRolloutEndTimestamp = currentRolloutEndTimestamp;
  }
}
