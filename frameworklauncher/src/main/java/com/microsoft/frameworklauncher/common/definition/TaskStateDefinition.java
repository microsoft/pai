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

package com.microsoft.frameworklauncher.common.definition;

import com.microsoft.frameworklauncher.common.model.TaskState;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class TaskStateDefinition {
  public static final Set<TaskState> START_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.TASK_WAITING
      )));

  public static final Set<TaskState> FINAL_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.TASK_COMPLETED
      )));

  public static final Set<TaskState> CONTAINER_LIVE_ASSOCIATED_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.CONTAINER_ALLOCATED,
          TaskState.CONTAINER_LAUNCHED,
          TaskState.CONTAINER_RUNNING
      )));

  public static final Set<TaskState> CONTAINER_ASSOCIATED_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.CONTAINER_ALLOCATED,
          TaskState.CONTAINER_LAUNCHED,
          TaskState.CONTAINER_RUNNING,
          TaskState.CONTAINER_COMPLETED,
          TaskState.TASK_COMPLETED
      )));

  public static final Set<TaskState> STATE_CORRUPTED_AFTER_RESTART_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.CONTAINER_REQUESTED,
          TaskState.CONTAINER_ALLOCATED,
          TaskState.CONTAINER_LAUNCHED
      )));

  public static final Set<TaskState> QUEUE_CORRUPTED_AFTER_RESTART_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          TaskState.TASK_WAITING,
          TaskState.CONTAINER_COMPLETED
      )));
}
