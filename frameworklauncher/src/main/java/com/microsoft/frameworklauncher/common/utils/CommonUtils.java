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

package com.microsoft.frameworklauncher.common.utils;

import com.microsoft.frameworklauncher.common.exceptions.NotFoundException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import org.apache.commons.io.FileUtils;
import org.apache.hadoop.util.Shell;
import org.apache.hadoop.util.StringUtils;

import java.io.File;
import java.util.Arrays;
import java.util.Random;
import java.util.concurrent.Callable;
import java.util.concurrent.locks.Lock;

public class CommonUtils {
  private static final DefaultLogger LOGGER = new DefaultLogger(CommonUtils.class);
  private static final Random RANDOM = new Random();

  public static synchronized int getRandomNumber(int min, int max) {
    return min + RANDOM.nextInt(Math.max(max - min, 0) + 1);
  }

  public static String toString(Throwable e) {
    return "\nException:\n" + StringUtils.stringifyException(e);
  }

  public static <T> T checkExist(T o) throws NotFoundException {
    if (o == null) {
      throw new NotFoundException();
    }
    return o;
  }

  public static void executeWithLock(Lock lock, CommonExts.VoidCallable action) throws Exception {
    executeWithLock(lock, () -> {
      action.call();
      return null;
    });
  }

  public static <T> T executeWithLock(Lock lock, Callable<T> action) throws Exception {
    lock.lock();
    try {
      return action.call();
    } finally {
      lock.unlock();
    }
  }

  // Return stdout if succeeded, throw Exception with exitcode and stderr if failed
  // Returned stdout is guaranteed to not null
  public static String executeCmdLine(String cmdLine) throws Exception {
    return executeCmdLine(cmdLine, 0);
  }

  public static String executeCmdLine(String cmdLine, long timeOutSec) throws Exception {
    return Shell.execCommand(null, cmdLine.split("\\s+"), timeOutSec);
  }

  public static String getCallerMethodName() {
    String callerMethodName;
    try {
      StackTraceElement[] stackTraceElements = Thread.currentThread().getStackTrace();
      callerMethodName = stackTraceElements[2].getMethodName();
    } catch (Exception e) {
      callerMethodName = "";
    }

    return callerMethodName;
  }

  public static String getCallerClassName() {
    String callerClassName;
    try {
      StackTraceElement[] stackTraceElements = Thread.currentThread().getStackTrace();
      callerClassName = stackTraceElements[2].getClassName();
    } catch (Exception e) {
      callerClassName = "";
    }

    return callerClassName;
  }

  public static String formatString(String format, Object... args) {
    return (args != null && args.length > 0) ? String.format(format, args) : format;
  }

  public static String getEnvironmentVariable(String name) throws Exception {
    return getEnvironmentVariable(name, null);
  }

  public static String getEnvironmentVariable(String name, String defaultValue) throws Exception {
    String value = System.getenv(name);
    if (value == null) {
      String message = String.format("Failed to find environment variable %1$s.", name);
      if (defaultValue == null) {
        throw new Exception(message + " And no default value given.");
      } else {
        LOGGER.logWarning(message + " Using default value [%1$s].", defaultValue);
        value = defaultValue;
      }
    }

    return value;
  }

  public static String writeFile(String filePath, String content) throws Exception {
    FileUtils.writeStringToFile(new File(filePath), content);
    return filePath;
  }

  public static String readFile(String filePath) throws Exception {
    return FileUtils.readFileToString(new File(filePath));
  }

  public static byte[] subArray(byte[] array, int startIndex, int length) {
    return Arrays.copyOfRange(array, startIndex, startIndex + length);
  }

  public static byte[] concatArrays(byte[] arrayHead, byte[] arrayTail) {
    byte[] result = Arrays.copyOf(arrayHead, arrayHead.length + arrayTail.length);
    System.arraycopy(arrayTail, 0, result, arrayHead.length, arrayTail.length);
    return result;
  }

  public static int bytesToShort(byte[] bytes) {
    int low = bytes[0] & 0xFF;
    int high = bytes[1] & 0xFF;
    return (high << 8) | low;
  }
}
