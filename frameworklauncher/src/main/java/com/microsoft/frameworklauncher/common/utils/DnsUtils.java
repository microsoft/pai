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

import com.microsoft.frameworklauncher.common.log.DefaultLogger;

import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * DnsUtils makes Best Effort to resolve external IP and Host.
 * An external IP address is the address that other machines is able to connect to it.
 * Note, not all IP addresses are reachable outside the local machine or LAN, such as,
 * the virtual network IP addresses, the private network IP addresses, and so on.
 */
public class DnsUtils {
  private static final DefaultLogger LOGGER = new DefaultLogger(DnsUtils.class);

  // Assume local address will not change on the fly, so cache it on initialization.
  private static final String LOCAL_HOST;
  private static final String LOCAL_IP;

  static {
    LOGGER.logInfo("Resolving local address");

    InetAddress localAddress = null;

    // First use DatagramSocket to resolve, since it will automatically choose
    // the preferred outbound IP address which should be external.
    try {
      DatagramSocket socket = new DatagramSocket();

      // Initialize the local address which will be used to connect with the remote address.
      // The remote address can be unreachable dummy address since there is no real
      // connection established here.
      socket.connect(Inet4Address.getByName("1.2.3.4"), 1234);
      InetAddress socketLocalAddress = socket.getLocalAddress();

      if (!(socketLocalAddress instanceof Inet4Address) ||
          socketLocalAddress.isMulticastAddress() ||
          socketLocalAddress.isLoopbackAddress() ||
          socketLocalAddress.isAnyLocalAddress()) {
        throw new Exception(String.format(
            "SocketLocalAddress [%s] is not usable", socketLocalAddress));
      }

      localAddress = socketLocalAddress;
    } catch (Exception e) {
      LOGGER.logWarning(e, "Failed to resolve local address by DatagramSocket");
    }

    if (localAddress == null) {
      try {
        localAddress = Inet4Address.getLocalHost();
      } catch (Exception e) {
        LOGGER.logWarning(e, "Failed to resolve local address by InetAddress");
      }
    }

    if (localAddress == null) {
      LOGGER.logWarning(
          "Failed to resolve local address by all means. " +
              "Fallback to loopback address");
      localAddress = Inet4Address.getLoopbackAddress();
    }

    LOCAL_HOST = localAddress.getHostName().trim();
    LOCAL_IP = localAddress.getHostAddress().trim();

    LOGGER.logInfo("Resolved local address: [%s]", localAddress);
  }

  public static String resolveIp(String hostName) throws UnknownHostException {
    if (LOCAL_HOST.equalsIgnoreCase(hostName.trim())) {
      return LOCAL_IP;
    } else {
      return Inet4Address.getByName(hostName).getHostAddress();
    }
  }

  public static String getLocalHost() {
    return LOCAL_HOST;
  }

  public static String getLocalIp() {
    return LOCAL_IP;
  }
}
