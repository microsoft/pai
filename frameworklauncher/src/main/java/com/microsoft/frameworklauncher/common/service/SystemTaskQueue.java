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

package com.microsoft.frameworklauncher.common.service;

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;

public class SystemTaskQueue {
  private static final DefaultLogger LOGGER = new DefaultLogger(SystemTaskQueue.class);
  private static final int QUEUE_LENGTH_WARNING_THRESHOLD = 5000;

  public Function<Exception, Boolean> exceptionHandler;
  private ScheduledExecutorService executorService;
  private Lock lock = new ReentrantLock();
  private Condition condition = lock.newCondition();

  public SystemTaskQueue(Function<Exception, Boolean> handler) {
    executorService = Executors.newScheduledThreadPool(1);
    exceptionHandler = handler;
    executorService.submit(this::waitToStart);
  }

  private void waitToStart() {
    lock.lock();
    LOGGER.logInfo("Waiting to start SystemTaskQueue");
    try {
      condition.awaitUninterruptibly();
    } finally {
      lock.unlock();
    }
  }

  public void start() {
    lock.lock();
    try {
      condition.signal();
    } finally {
      lock.unlock();
    }
    LOGGER.logInfo("Running SystemTaskQueue. Current Queue Length %s.", length());
  }

  public int length() {
    return ((ThreadPoolExecutor) executorService).getQueue().size() + 1;
  }

  private void checkTaskQueueHealthy() {
    int len = length();
    if (len > QUEUE_LENGTH_WARNING_THRESHOLD) {
      LOGGER.logWarning("Too many Tasks in Queue. Current Queue Length %s.", len);
    }
  }

  private Runnable setupTaskExceptionHandler(CommonExts.VoidCallable task) {
    return () -> {
      try {
        task.call();
      } catch (Exception e) {
        exceptionHandler.apply(e);
      }
    };
  }

  public void queueSystemTask(CommonExts.VoidCallable task) {
    executorService.submit(setupTaskExceptionHandler(task));
    checkTaskQueueHealthy();
  }

  public void queueSystemTaskDelayed(CommonExts.VoidCallable task, long milliseconds) {
    executorService.schedule(setupTaskExceptionHandler(task), milliseconds, TimeUnit.MILLISECONDS);
    checkTaskQueueHealthy();
  }
}
