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

package com.microsoft.frameworklauncher.common.log;

import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import java.util.HashMap;
import java.util.Map;

public class ChangeAwareLogger {
  // Used to log for itself
  private static final DefaultLogger LOGGER = new DefaultLogger(ChangeAwareLogger.class);

  // Limit to 100MB (around 1000000 records each with 100B size)
  private static final long LAST_LOGS_MAX_SIZE_BYTES = 100 * 1024 * 1024;
  private final Logger logger;
  private final Map<String, Level> changeLogLevels = new HashMap<>();
  private final Map<String, Level> unchangeLogLevels = new HashMap<>();
  private final Map<String, String> lastLogs = new HashMap<>();
  private long lastLogsCurrentSizeBytes = 0;

  public ChangeAwareLogger(Class clazz) {
    logger = Logger.getLogger(clazz.getName());
  }

  public synchronized void initializeScope(String scope, Level changeLogLevel) {
    changeLogLevels.put(scope, changeLogLevel);
  }

  public synchronized void initializeScope(String scope, Level changeLogLevel, Level unchangeLogLevel) {
    initializeScope(scope, changeLogLevel);
    unchangeLogLevels.put(scope, unchangeLogLevel);
  }

  public synchronized void log(String scope, String format, Object... args) throws Exception {
    String msg = CommonUtils.formatString(format, args);

    if (!changeLogLevels.containsKey(scope)) {
      throw new Exception(String.format(
          "Scope [%1$s] is not initialized for before log it.", scope));
    }

    if (lastLogs.containsKey(scope) && lastLogs.get(scope).equals(msg)) {
      if (unchangeLogLevels.containsKey(scope)) {
        logger.log(unchangeLogLevels.get(scope), msg);
      }
    } else {
      if (lastLogs.containsKey(scope)) {
        lastLogsCurrentSizeBytes -= lastLogs.get(scope).length();
        lastLogsCurrentSizeBytes += msg.length();
      } else {
        lastLogsCurrentSizeBytes += scope.length();
        lastLogsCurrentSizeBytes += msg.length();
      }

      lastLogs.put(scope, msg);
      logger.log(changeLogLevels.get(scope), msg);
    }

    if (lastLogsCurrentSizeBytes > LAST_LOGS_MAX_SIZE_BYTES) {
      LOGGER.logWarning("The current last log size %1$s exceed limit %2$s, clear it. " +
              "Future info logs may contain unchanged log.",
          lastLogsCurrentSizeBytes, LAST_LOGS_MAX_SIZE_BYTES);

      lastLogsCurrentSizeBytes = 0;
      lastLogs.clear();
    }
  }
}
