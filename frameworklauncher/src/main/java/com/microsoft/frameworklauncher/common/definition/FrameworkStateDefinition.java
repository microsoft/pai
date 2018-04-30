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

import com.microsoft.frameworklauncher.common.model.FrameworkState;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class FrameworkStateDefinition {
  public static final Set<FrameworkState> START_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.FRAMEWORK_WAITING
      )));

  public static final Set<FrameworkState> FINAL_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.FRAMEWORK_COMPLETED
      )));

  public static final Set<FrameworkState> APPLICATION_LIVE_ASSOCIATED_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.APPLICATION_CREATED,
          FrameworkState.APPLICATION_LAUNCHED,
          FrameworkState.APPLICATION_WAITING,
          FrameworkState.APPLICATION_RUNNING
      )));

  public static final Set<FrameworkState> APPLICATION_ASSOCIATED_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.APPLICATION_CREATED,
          FrameworkState.APPLICATION_LAUNCHED,
          FrameworkState.APPLICATION_WAITING,
          FrameworkState.APPLICATION_RUNNING,
          FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS,
          FrameworkState.APPLICATION_COMPLETED,
          FrameworkState.FRAMEWORK_COMPLETED
      )));


  public static final Set<FrameworkState> STATE_CORRUPTED_AFTER_RESTART_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.APPLICATION_CREATED
      )));

  public static final Set<FrameworkState> QUEUE_CORRUPTED_AFTER_RESTART_STATES = Collections.unmodifiableSet(
      new HashSet<>(Arrays.asList(
          FrameworkState.FRAMEWORK_WAITING,
          FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS,
          FrameworkState.APPLICATION_COMPLETED
      )));
}
