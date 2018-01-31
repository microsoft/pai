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

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;

import java.util.concurrent.Callable;
import java.util.function.Predicate;

public class RetryUtils {
  private static final DefaultLogger LOGGER = new DefaultLogger(RetryUtils.class);
  private static final int RETRIED_COUNT_FOR_MIN_DELAY_SEC = 0;
  private static final int RETRIED_COUNT_FOR_MAX_DELAY_SEC = 6;

  public static void executeWithRetry(
      CommonExts.VoidCallable action,
      int maxRetryCount,
      int retryIntervalSec,
      Predicate<Exception> shouldRetry) throws InterruptedException, AggregateException {
    executeWithRetry(() -> {
      action.call();
      return null;
    }, maxRetryCount, retryIntervalSec, shouldRetry);
  }

  public static <T> T executeWithRetry(
      Callable<T> action,
      int maxRetryCount,
      int retryIntervalSec,
      Predicate<Exception> shouldRetry)
      throws AggregateException, InterruptedException {

    int retriedCount = 0;
    AggregateException ae = new AggregateException();

    while (true) {
      try {
        return action.call();
      } catch (Exception e) {
        ae.addException(e);

        String logPrefix = String.format("Retry [%s / %s]: ", retriedCount, maxRetryCount);

        if ((shouldRetry != null && !shouldRetry.test(e)) ||
            (maxRetryCount != GlobalConstants.USING_UNLIMITED_VALUE && retriedCount >= maxRetryCount)) {
          LOGGER.logError(e, logPrefix + "Failed Finally.");
          throw ae;
        } else {
          LOGGER.logWarning(e, logPrefix + "Failed. Scheduled to Retry after %ss.", retryIntervalSec);
          if (retryIntervalSec > 0) {
            Thread.sleep(retryIntervalSec * 1000);
          }
          retriedCount++;
        }
      }
    }
  }

  public static int calcRandomBackoffDelay(int retriedCount, int minDelaySec, int maxDelaySec) {
    LOGGER.logInfo(
        "calcRandomBackoffDelay: RetriedCount: %s, MinDelaySec: %s, MaxDelaySec: %s",
        retriedCount, minDelaySec, maxDelaySec);

    float contentionDegree = Math.min(1, (float) retriedCount / (RETRIED_COUNT_FOR_MAX_DELAY_SEC - RETRIED_COUNT_FOR_MIN_DELAY_SEC));
    int minDelaySecThisTime = minDelaySec;
    int maxDelaySecThisTime = minDelaySec + (int) (contentionDegree * (maxDelaySec - minDelaySec));
    int randomBackoffDelay = CommonUtils.getRandomNumber(minDelaySecThisTime, maxDelaySecThisTime);

    LOGGER.logInfo(
        "calcRandomBackoffDelay: ContentionDegree: %s, MinDelaySecThisTime: %s, MaxDelaySecThisTime: %s, RandomBackoffDelay: %s",
        contentionDegree, minDelaySecThisTime, maxDelaySecThisTime, randomBackoffDelay);
    return randomBackoffDelay;
  }
}
