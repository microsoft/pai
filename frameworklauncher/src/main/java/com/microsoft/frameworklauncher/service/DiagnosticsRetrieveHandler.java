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

package com.microsoft.frameworklauncher.service;

import com.microsoft.frameworklauncher.common.exit.ExitDiagnostics;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.LauncherConfiguration;
import com.microsoft.frameworklauncher.common.utils.RetryUtils;
import org.apache.hadoop.yarn.client.api.YarnClient;

public class DiagnosticsRetrieveHandler { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(DiagnosticsRetrieveHandler.class);

  private final Service service;
  private final LauncherConfiguration conf;
  private final YarnClient yarnClient;

  public DiagnosticsRetrieveHandler(Service service, LauncherConfiguration conf, YarnClient yarnClient) {
    this.service = service;
    this.conf = conf;
    this.yarnClient = yarnClient;
  }

  public void retrieveDiagnosticsAsync(String applicationId, String initDiagnostics) {
    new Thread(() -> {
      String diagnostics = initDiagnostics;

      try {
        LOGGER.logInfo("%s: Start to retrieveDiagnostics", applicationId);

        if (ExitDiagnostics.isDiagnosticsEmpty(diagnostics)) {
          diagnostics = RetryUtils.executeWithRetry(
              () -> ExitDiagnostics.retrieveDiagnostics(yarnClient, applicationId),
              conf.getApplicationRetrieveDiagnosticsMaxRetryCount(),
              conf.getApplicationRetrieveDiagnosticsRetryIntervalSec(), null);
        }

        LOGGER.logInfo("%s: Succeeded to retrieveDiagnostics", applicationId);
      } catch (Exception e) {
        LOGGER.logError(e, "%s: Failed to retrieveDiagnostics", applicationId);
      }

      try {
        service.onDiagnosticsRetrieved(applicationId, diagnostics);
      } catch (Exception e) {
        service.onExceptionOccurred(e);
      }
    }).start();
  }
}