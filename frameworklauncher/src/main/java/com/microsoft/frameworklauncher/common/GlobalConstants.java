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

package com.microsoft.frameworklauncher.common;

import com.microsoft.frameworklauncher.common.utils.DnsUtils;

public class GlobalConstants {
  public static final String LAUNCHER_CONFIG_FILE = "frameworklauncher.yml";
  public static final String LOGGER_CONFIG_FILE = "log4j.properties";
  public static final String CONTAINER_IP_LIST_FILE = "ContainerIpList.ini";
  public static final int USING_UNLIMITED_VALUE = -1;
  public static final int USING_DEFAULT_VALUE = -2;
  public static final String LAUNCHER_APPLICATION_TYPE = "LAUNCHER";
  public static final String PACKAGE_APPLICATION_MASTER_FILE = "frameworklauncher-1.0-SNAPSHOT-jar-with-dependencies.jar";
  public static final String PACKAGE_AGENT_FILE = "frameworklauncher-1.0-SNAPSHOT-jar-with-dependencies.jar";
  public static final String MAIN_CLASS_APPLICATION_MASTER = "com.microsoft.frameworklauncher.applicationmaster.Bootstrap";
  public static final String MAIN_CLASS_AGENT = "com.microsoft.frameworklauncher.agent.Bootstrap";
  public static final String ENV_VAR_CLASSPATH = "CLASSPATH";
  public static final String ENV_VAR_HADOOP_USER_NAME = "HADOOP_USER_NAME";
  public static final String ENV_VAR_FRAMEWORK_NAME = "FRAMEWORK_NAME";
  public static final String ENV_VAR_FRAMEWORK_VERSION = "FRAMEWORK_VERSION";
  public static final String ENV_VAR_ZK_CONNECT_STRING = "ZK_CONNECT_STRING";
  public static final String ENV_VAR_ZK_ROOT_DIR = "ZK_ROOT_DIR";
  public static final String ENV_VAR_AM_VERSION = "AM_VERSION";
  public static final String ENV_VAR_AM_RM_HEARTBEAT_INTERVAL_SEC = "AM_RM_HEARTBEAT_INTERVAL_SEC";
  public static final String ENV_VAR_TASK_ROLE_NAME = "TASK_ROLE_NAME";
  public static final String ENV_VAR_TASK_INDEX = "TASK_INDEX";
  public static final String ENV_VAR_SERVICE_VERSION = "SERVICE_VERSION";
  public static final String ENV_VAR_APP_ID = "APP_ID";
  public static final String ENV_VAR_ATTEMPT_ID = "ATTEMPT_ID";
  public static final String ENV_VAR_USER = "USER";
  public static final String ENV_VAR_LOCAL_DIRS = "LOCAL_DIRS";
  public static final String ENV_VAR_LOG_DIRS = "LOG_DIRS";
  public static final String ENV_VAR_CONTAINER_ID = "CONTAINER_ID";
  public static final String ENV_VAR_CONTAINER_IP = "CONTAINER_IP";
  public static final String ENV_VAR_CONTAINER_GPUS = "CONTAINER_GPUS";
  public static final String ENV_VAR_CONTAINER_PORTS = "CONTAINER_PORTS";
  public static final String ENV_VAR_AGENT_HEARTBEAT_INTERVAL_SEC = "AGENT_HEARTBEAT_INTERVAL_SEC";
  public static final String ENV_VAR_AGENT_EXPIRY_INTERVAL_SEC = "AGENT_EXPIRY_INTERVAL_SEC";
  public static final String ENV_VAR_AM_HOST_NAME = "AM_HOST_NAME";
  public static final String ENV_VAR_AM_RPC_PORT = "AM_RPC_PORT";
  public static final String ENV_VAR_AGENT_USE_AGENT = "AGENT_USE_AGENT";
  public static final String ENV_VAR_AGENT_HEARTBEAT_MAX_RETRY_COUNT = "AGENT_HEARTBEAT_MAX_RETRY_COUNT";
  public static final String ENV_VAR_AGENT_HEARTBEAT_RETRY_INTERVAL_SEC = "AGENT_HEARTBEAT_RETRY_INTERVAL_SEC";
  public static final String ENV_VAR_AGENT_LAUNCHER_CLIENT_MAX_RETRY_COUNT = "AGENT_LAUNCHER_CLIENT_MAX_RETRY_COUNT";
  public static final String ENV_VAR_AGENT_LAUNCHER_CLIENT_RETRY_INTERVAL_SEC = "AGENT_LAUNCHER_CLIENT_RETRY_INTERVAL_SEC";
  public static final String ENV_VAR_AGENT_BOND_RPC_TIMEOUT_SEC = "AGENT_BOND_RPC_TIMEOUT_SEC";
  public static final String LINE = new String(new char[200]).replace("\0", "_");
  public static final String LOCAL_HOST_NAME = DnsUtils.resolveLocalHostName();
}
