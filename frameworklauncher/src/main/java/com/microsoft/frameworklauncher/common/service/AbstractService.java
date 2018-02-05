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

import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import org.apache.log4j.Level;

// Maintains the life cycle for one Service
public class AbstractService {
  private static final DefaultLogger LOGGER = new DefaultLogger(AbstractService.class);

  public final String serviceName;

  public AbstractService(String serviceName) {
    this.serviceName = serviceName;
  }

  public void start() {
    while (true) {
      try {
        initialize();
        recover();
        run();
        break;
      } catch (Exception e) {
        Boolean shouldRetry = handleException(e);
        if (!shouldRetry) {
          break;
        }
      }
    }
  }

  // Derived class only need to handle unwrapped Exception
  // Call it only when Service entered an unexpected state,
  // so Service should stop or Restart instead of continuing to make any progress.
  protected Boolean handleException(Exception e) {
    if (e instanceof AggregateException) {
      AggregateException ae = (AggregateException) e;
      for (Exception ei : ae.getExceptions()) {
        if (!handleException(ei)) {
          return false;
        }
      }
      return true;
    }

    return true;
  }

  protected void initialize() throws Exception {
    LOGGER.logInfo("Initializing %1$s", serviceName);
  }

  protected void recover() throws Exception {
    LOGGER.logInfo("Recovering %1$s", serviceName);
  }

  protected void run() throws Exception {
    LOGGER.logInfo("Running %1$s", serviceName);
  }

  public void stop(StopStatus stopStatus) {
    LOGGER.logSplittedLines(stopStatus.getCode() == 0 ? Level.INFO : Level.ERROR,
        "Stopping %1$s with StopStatus: %2$s", serviceName, stopStatus);
  }
}

