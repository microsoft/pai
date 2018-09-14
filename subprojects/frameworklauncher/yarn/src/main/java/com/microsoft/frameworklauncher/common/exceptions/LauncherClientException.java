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

package com.microsoft.frameworklauncher.common.exceptions;

import com.microsoft.frameworklauncher.common.web.WebClientOutput;

/**
 * All possible Exceptions that may be thrown by LauncherClient
 */
public class LauncherClientException extends Exception {
  private final WebClientOutput webClientOutput;
  private final Boolean isTransient;

  public LauncherClientException(String message, WebClientOutput webClientOutput, Boolean isTransient) {
    super(message, webClientOutput.getClientSideException());
    this.webClientOutput = webClientOutput;
    this.isTransient = isTransient;
  }

  /**
   * Only keep the last WebClientOutput of all retries.
   */
  public WebClientOutput getWebClientOutput() {
    return webClientOutput;
  }

  /**
   * Whether it is caused by Transient Failures.
   */
  public Boolean isTransient() {
    return isTransient;
  }

  public String toString() {
    return String.format(
        "%2$s%1$s%1$sWebClientOutput:%1$s%3$s%1$s%1$sIsTransient: %4$s",
        "\n", super.toString(), webClientOutput, isTransient);
  }
}
