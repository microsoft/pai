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
import javax.validation.constraints.Min;
import java.io.Serializable;

/**
 * TaskRoleApplicationCompletionPolicyDescriptor can be configured for each TaskRole to control:
 * 1. The conditions to complete the Application.
 * 2. The ExitStatus of the completed Application.
 *
 * More Specifically:
 * 1. If minFailedTaskCount != null and minFailedTaskCount <= failed Task count of current TaskRole,
 *    immediately complete the Application, regardless of any uncompleted Task,
 *    and the ExitStatus is failed which is generated from the last failed Task of current TaskRole.
 * 2. If minSucceededTaskCount != null and minSucceededTaskCount <= succeeded Task count of current TaskRole,
 *    immediately complete the Application, regardless of any uncompleted Task,
 *    and the ExitStatus is succeeded which is generated from the last succeeded Task of current TaskRole.
 * 3. If multiple above 1. and 2. conditions of all TaskRoles are satisfied at the same time,
 *    the behavior can be any one of these satisfied conditions.
 * 4. If none of above 1. and 2. conditions of all TaskRoles are satisfied until all Tasks of the Framework completed,
 *    immediately complete the Application
 *    and the ExitStatus is succeeded which is not generated from any Task.
 *
 * Notes:
 * 1. The completed Application's FrameworkState is APPLICATION_COMPLETED,
 *    so the Framework may be still retried with another new Application according to the FrameworkRetryPolicy.
 * 2. The completed Application's ExitStatus includes
 *    ApplicationExitCode, ApplicationExitDiagnostics, ApplicationExitType.
 */
public class TaskRoleApplicationCompletionPolicyDescriptor implements Serializable {
  @Valid
  @Min(1)
  // Min failed Task count of current TaskRole to immediately trigger ApplicationCompletion as failed.
  private Integer minFailedTaskCount = 1;

  @Valid
  @Min(1)
  // Min succeeded Task count of current TaskRole to immediately trigger ApplicationCompletion as succeeded.
  private Integer minSucceededTaskCount;

  public Integer getMinFailedTaskCount() {
    return minFailedTaskCount;
  }

  public void setMinFailedTaskCount(Integer minFailedTaskCount) {
    this.minFailedTaskCount = minFailedTaskCount;
  }

  public Integer getMinSucceededTaskCount() {
    return minSucceededTaskCount;
  }

  public void setMinSucceededTaskCount(Integer minSucceededTaskCount) {
    this.minSucceededTaskCount = minSucceededTaskCount;
  }
}
