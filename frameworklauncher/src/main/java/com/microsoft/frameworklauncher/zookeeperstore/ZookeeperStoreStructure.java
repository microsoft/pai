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

package com.microsoft.frameworklauncher.zookeeperstore;

import org.apache.commons.lang.StringUtils;

public class ZookeeperStoreStructure {
  private static final String PATH_SEPARATOR = "/";
  private final String launcherRootPath;
  private final String launcherRequestPath;
  private final String launcherStatusPath;

  public ZookeeperStoreStructure(String launcherRootPath) {
    this.launcherRootPath = launcherRootPath;
    launcherRequestPath = getNodePath(this.launcherRootPath, "Requests");
    launcherStatusPath = getNodePath(this.launcherRootPath, "Statuses");
  }

  public static String getNodePath(String parentNodePath, String nodeName) {
    return (StringUtils.stripEnd(parentNodePath, PATH_SEPARATOR) +
        PATH_SEPARATOR +
        StringUtils.stripStart(nodeName, PATH_SEPARATOR));
  }

  public static String getNodeName(String path) {
    Integer t = path.length() - 1;
    if (path.endsWith(PATH_SEPARATOR)) t--;

    int s = path.lastIndexOf(PATH_SEPARATOR, t) + 1;
    return path.substring(s, t + 1);
  }

  public String getLauncherRootPath() {
    return launcherRootPath;
  }

  // Requests
  public String getLauncherRequestPath() {
    return launcherRequestPath;
  }

  public String getFrameworkRequestPath(String frameworkName) {
    return getNodePath(getLauncherRequestPath(), frameworkName);
  }

  public String getOverrideApplicationProgressRequestPath(String frameworkName) {
    return getNodePath(getFrameworkRequestPath(frameworkName), "OverrideApplicationProgressRequest");
  }

  public String getMigrateTaskRequestsPath(String frameworkName) {
    return getNodePath(getFrameworkRequestPath(frameworkName), "MigrateTaskRequests");
  }

  public String getMigrateTaskRequestPath(String frameworkName, String containerId) {
    return getNodePath(getMigrateTaskRequestsPath(frameworkName), containerId);
  }

  // Statuses
  public String getLauncherStatusPath() {
    return launcherStatusPath;
  }

  public String getFrameworkStatusPath(String frameworkName) {
    return getNodePath(getLauncherStatusPath(), frameworkName);
  }

  public String getTaskRoleStatusPath(String frameworkName, String taskRoleName) {
    return getNodePath(getFrameworkStatusPath(frameworkName), taskRoleName);
  }

  public String getTaskStatusesPath(String frameworkName, String taskRoleName) {
    return getNodePath(getTaskRoleStatusPath(frameworkName, taskRoleName), "TaskStatuses");
  }
}
