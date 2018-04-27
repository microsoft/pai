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

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

public class DefaultLogger {
  private final Logger logger;

  public DefaultLogger(Class clazz) {
    logger = Logger.getLogger(clazz.getName());
  }

  public void log(Level level, String format, Object... args) {
    logger.log(level, CommonUtils.formatString(format, args));
  }

  public void logSplittedLines(Level level, String format, Object... args) {
    String msg = CommonUtils.formatString(format, args);
    String[] splittedMsgs = msg.split("\\r?\\n");

    logger.log(level, GlobalConstants.LINE);
    for (String splittedMsg : splittedMsgs) {
      logger.log(level, splittedMsg);
    }
    logger.log(level, GlobalConstants.LINE);
  }

  public void logTrace(String format, Object... args) {
    if (logger.isTraceEnabled()) {
      logger.trace(CommonUtils.formatString(format, args));
    }
  }

  public void logDebug(String format, Object... args) {
    logger.debug(CommonUtils.formatString(format, args));
  }

  public void logInfo(String format, Object... args) {
    logger.info(CommonUtils.formatString(format, args));
  }

  public void logWarning(String format, Object... args) {
    logger.warn(CommonUtils.formatString(format, args));
  }

  public void logError(String format, Object... args) {
    logger.error(CommonUtils.formatString(format, args));
  }

  public void logFatal(String format, Object... args) {
    logger.fatal(CommonUtils.formatString(format, args));
  }

  // With Throwable Logged
  public void log(Throwable e, Level level, Object... args) {
    log(e, level, "", args);
  }

  public void log(Throwable e, Level level, String format, Object... args) {
    logger.log(level, CommonUtils.formatString(format, args), e);
  }

  public void logTrace(Throwable e, Object... args) {
    logTrace(e, "", args);
  }

  public void logTrace(Throwable e, String format, Object... args) {
    if (logger.isTraceEnabled()) {
      logger.trace(CommonUtils.formatString(format, args), e);
    }
  }

  public void logDebug(Throwable e, Object... args) {
    logDebug(e, "", args);
  }

  public void logDebug(Throwable e, String format, Object... args) {
    logger.debug(CommonUtils.formatString(format, args), e);
  }

  public void logInfo(Throwable e, Object... args) {
    logInfo(e, "", args);
  }

  public void logInfo(Throwable e, String format, Object... args) {
    logger.info(CommonUtils.formatString(format, args), e);
  }

  public void logWarning(Throwable e, Object... args) {
    logWarning(e, "", args);
  }

  public void logWarning(Throwable e, String format, Object... args) {
    logger.warn(CommonUtils.formatString(format, args), e);
  }

  public void logError(Throwable e, Object... args) {
    logError(e, "", args);
  }

  public void logError(Throwable e, String format, Object... args) {
    logger.error(CommonUtils.formatString(format, args), e);
  }

  public void logFatal(Throwable e, Object... args) {
    logFatal(e, "", args);
  }

  public void logFatal(Throwable e, String format, Object... args) {
    logger.fatal(CommonUtils.formatString(format, args), e);
  }
}
