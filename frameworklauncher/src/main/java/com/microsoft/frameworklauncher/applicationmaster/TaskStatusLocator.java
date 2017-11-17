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

package com.microsoft.frameworklauncher.applicationmaster;

public class TaskStatusLocator implements Comparable<TaskStatusLocator> {
  private final String taskRoleName;
  private final int taskIndex;

  public TaskStatusLocator(String taskRoleName, int taskIndex) {
    this.taskRoleName = taskRoleName;
    this.taskIndex = taskIndex;
  }

  public String getTaskRoleName() {
    return taskRoleName;
  }

  public int getTaskIndex() {
    return taskIndex;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (!(obj instanceof TaskStatusLocator))
      return false;
    TaskStatusLocator other = (TaskStatusLocator) obj;
    return compareTo(other) == 0;
  }

  @Override
  public int compareTo(TaskStatusLocator other) {
    int ret = taskRoleName.compareTo(other.taskRoleName);
    if (ret == 0) {
      ret = Integer.valueOf(taskIndex).compareTo(other.taskIndex);
    }
    return ret;
  }

  @Override
  public int hashCode() {
    return toString().hashCode();
  }

  @Override
  public String toString() {
    return String.format("[%s][%s]", taskRoleName, taskIndex);
  }
}
