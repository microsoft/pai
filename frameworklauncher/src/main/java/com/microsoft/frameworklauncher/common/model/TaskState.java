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

public enum TaskState implements Serializable {
  // Task Waiting to Request Container
  //    [START_STATES]
  //    addContainerRequest       -> CONTAINER_REQUESTED
  TASK_WAITING,

  // Task's Container Requested
  //    onContainersAllocated:Accepted  -> CONTAINER_ALLOCATED
  //    onContainersAllocated:Rejected  -> TASK_WAITING
  //    containerRequestTimeout         -> TASK_WAITING
  //    recover                         -> TASK_WAITING
  CONTAINER_REQUESTED,

  // Task's current associated Container Allocated
  //    startContainerAsync       -> CONTAINER_LAUNCHED
  //    onContainersCompleted     -> CONTAINER_COMPLETED
  //    resyncWithRM              -> CONTAINER_COMPLETED
  //    recover                   -> CONTAINER_RUNNING
  CONTAINER_ALLOCATED,

  // Task's current associated Container Launched
  //    onContainerStarted        -> CONTAINER_RUNNING
  //    onStartContainerError     -> CONTAINER_COMPLETED
  //    onContainersCompleted     -> CONTAINER_COMPLETED
  //    resyncWithRM              -> CONTAINER_COMPLETED
  //    recover                   -> CONTAINER_RUNNING
  CONTAINER_LAUNCHED,

  // Task's current associated Container Running
  //    onContainersCompleted     -> CONTAINER_COMPLETED
  //    resyncWithRM              -> CONTAINER_COMPLETED
  CONTAINER_RUNNING,

  // Task's current associated Container Completed
  //  attemptToRetry              -> TASK_WAITING
  //  attemptToRetry              -> TASK_COMPLETED
  CONTAINER_COMPLETED,

  // Task Completed, possibly with Container retries
  //    [FINAL_STATES]
  TASK_COMPLETED,
}
