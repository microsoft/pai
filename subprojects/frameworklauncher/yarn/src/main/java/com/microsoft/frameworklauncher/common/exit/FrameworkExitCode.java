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

package com.microsoft.frameworklauncher.common.exit;

/**
 * Predefined ExitCode for User Framework exit:
 * 1. It should be within range [-7999, -7100], [0, 0] to avoid conflicts with
 *    all the possible Failure ExitCode [1, 255] which is got from User
 *    Container exit and Failure ExitCode [-7099, -1] which is got from YARN.
 *
 * 2. Smaller ExitCode should be more specific, so that it will be picked
 *    if multiple ExitCodes are recognized.
 *
 * See Also:
 * 1. Configurable Failure ExitCode for User Container exit:
 *    See UserContainerExitSpec.
 * 2. Predefined ExitCode for Launcher itself exit:
 *    See GlobalConstants.
 */
public enum FrameworkExitCode {
  // [0, 0]:
  // Success ExitCode which is issued from User Container
  SUCCEEDED(0),

  // [-7199, -7100]:
  // Failure ExitCode which is issued from Launcher AM to User Container
  /// Container Init Failed by YARN
  CONTAINER_INVALID_EXIT_STATUS(-7100),
  CONTAINER_NOT_AVAILABLE_EXIT_STATUS(-7101),
  CONTAINER_NODE_DISKS_FAILED(-7102),
  CONTAINER_PORT_CONFLICT(-7103),
  /// Container Aborted by YARN
  CONTAINER_ABORTED(-7110),
  CONTAINER_NODE_LOST(-7111),
  CONTAINER_EXPIRED(-7112),
  CONTAINER_ABORTED_ON_AM_RESTART(-7113),
  /// Container Other Failed by YARN
  CONTAINER_PREEMPTED(-7120),
  CONTAINER_VIRTUAL_MEMORY_EXCEEDED(-7121),
  CONTAINER_PHYSICAL_MEMORY_EXCEEDED(-7122),
  CONTAINER_KILLED_BY_AM(-7123),
  CONTAINER_KILLED_BY_RM(-7124),
  CONTAINER_KILLED_ON_APP_COMPLETION(-7125),
  CONTAINER_EXTERNAL_UTILIZATION_SPIKED(-7126),
  /// Container Failed by Launcher AM
  CONTAINER_NM_LAUNCH_FAILED(-7150),
  CONTAINER_RM_RESYNC_LOST(-7151),
  CONTAINER_RM_RESYNC_EXCEEDED(-7152),
  CONTAINER_MIGRATE_TASK_REQUESTED(-7153),
  CONTAINER_AGENT_EXPIRED(-7154),

  // [-7299, -7200]:
  // Failure ExitCode which is issued from Launcher AM to User App
  /// App Failed by YARN
  AM_RM_HEARTBEAT_YARN_EXCEPTION(-7200),
  AM_RM_HEARTBEAT_IO_EXCEPTION(-7201),
  AM_RM_HEARTBEAT_UNKNOWN_EXCEPTION(-7202),
  AM_RM_HEARTBEAT_SHUTDOWN_REQUESTED(-7203),
  /// App Failed by Launcher AM
  AM_UNKNOWN_EXCEPTION(-7250),
  AM_NON_TRANSIENT_EXCEPTION(-7251),
  AM_GANG_ALLOCATION_TIMEOUT(-7252),

  // [-7399, -7300]:
  // Failure ExitCode which is issued from Launcher Service to User App
  /// App Failed by YARN
  APP_SUBMISSION_YARN_EXCEPTION(-7300),
  APP_SUBMISSION_IO_EXCEPTION(-7301),
  APP_SUBMISSION_UNKNOWN_EXCEPTION(-7302),
  APP_KILLED_UNEXPECTEDLY(-7303),
  /// App Failed by Launcher Service
  APP_RM_RESYNC_LOST(-7350),
  APP_STOP_FRAMEWORK_REQUESTED(-7351),
  APP_AM_DIAGNOSTICS_LOST(-7352),
  APP_AM_DIAGNOSTICS_DESERIALIZATION_FAILED(-7353),

  // [-7499, -7400]:
  // Failure ExitCode which is issued from Launcher WebServer to User Task
  TASK_STOPPED_ON_APP_COMPLETION(-7400);

  private final int code;

  FrameworkExitCode(int code) {
    this.code = code;
  }

  public int toInt() {
    return code;
  }
}
