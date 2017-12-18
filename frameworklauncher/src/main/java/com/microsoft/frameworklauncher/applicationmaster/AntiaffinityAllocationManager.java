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

package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.utils.DefaultLogger;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;

// TODO: Make node label works with AntiaffinityAllocationManager
public class AntiaffinityAllocationManager { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(AntiaffinityAllocationManager.class);

  // Candidate request host names for this application
  private final LinkedList<String> candidateRequestHostNames = new LinkedList<>();

  // Host name will be specified in the next Container request
  // Ensure next() is always available if not null
  private ListIterator<String> nextRequestHostName = null;

  public synchronized void updateCandidateRequestHostNames(
      List<String> hostNames) {
    LOGGER.logInfo("updateCandidateRequestHostNames: %s", hostNames.size());

    candidateRequestHostNames.clear();
    nextRequestHostName = null;

    if (hostNames.size() > 0) {
      // Randomly shuffle host name list to differentiate Container
      // allocation for each job
      Collections.shuffle(hostNames);
      for (String candidateNodeHostName : hostNames) {
        candidateRequestHostNames.addLast(candidateNodeHostName);
      }

      nextRequestHostName = candidateRequestHostNames.listIterator(0);
    }
  }

  public synchronized void addCandidateRequestHostName(String hostName) {
    if (!candidateRequestHostNames.contains(hostName)) {
      LOGGER.logInfo("addCandidateRequestHostName: %s", hostName);

      if (nextRequestHostName == null) {
        candidateRequestHostNames.addLast(hostName);
        nextRequestHostName = candidateRequestHostNames.listIterator(0);
      } else {
        // Since we know a Container just completed on the hostName, it is
        // better to request next Container on the hostName.
        nextRequestHostName.add(hostName);
        nextRequestHostName.previous();
      }
    }
  }

  public synchronized String getCandidateRequestHostName() {
    if (nextRequestHostName == null) {
      return null;
    } else {
      return circularAdvanceNextRequestHostName();
    }
  }

  public synchronized void removeCandidateRequestHostName(String hostName) {
    if (nextRequestHostName == null) {
      return;
    } else {
      int indexToRemove = candidateRequestHostNames.indexOf(hostName);
      if (indexToRemove == -1) {
        return;
      } else {
        LOGGER.logInfo("removeCandidateRequestHostName: %s", hostName);
        int indexOfNextRequestHostName = nextRequestHostName.nextIndex();
        candidateRequestHostNames.remove(indexToRemove);

        if (candidateRequestHostNames.size() == 0) {
          nextRequestHostName = null;
        } else {
          if (indexOfNextRequestHostName > indexToRemove) {
            indexOfNextRequestHostName--;
          }
          if (indexOfNextRequestHostName == candidateRequestHostNames.size()) {
            indexOfNextRequestHostName = 0;
          }
          nextRequestHostName = candidateRequestHostNames.listIterator(indexOfNextRequestHostName);
        }
      }
    }
  }

  private synchronized String circularAdvanceNextRequestHostName() {
    String hostName = nextRequestHostName.next();
    if (!nextRequestHostName.hasNext()) {
      nextRequestHostName = candidateRequestHostNames.listIterator(0);
    }
    return hostName;
  }
}
