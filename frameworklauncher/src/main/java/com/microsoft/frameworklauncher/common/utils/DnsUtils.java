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

import java.net.*;
import java.util.Enumeration;

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
  private static final String LOCAL_CANONICAL_HOST;
  private static final String LOCAL_IP;

  static {
    Inet4Address localAddress = resolveLocalAddress();
    LOCAL_HOST = localAddress.getHostName().trim();
    LOCAL_CANONICAL_HOST = localAddress.getCanonicalHostName().trim();
    LOCAL_IP = localAddress.getHostAddress().trim();
  }

  private static Inet4Address resolveLocalAddress() {
    LOGGER.logInfo("Resolving local address");

    Inet4Address localAddress = null;

    try {
      localAddress = resolveLocalAddressByDatagramSocket();
    } catch (Exception e) {
      LOGGER.logWarning(e, "Failed to resolve local address by DatagramSocket");
    }

    if (localAddress == null) {
      try {
        localAddress = resolveLocalAddressByInet4Address();
      } catch (Exception e) {
        LOGGER.logWarning(e, "Failed to resolve local address by Inet4Address");
      }
    }

    if (localAddress == null) {
      try {
        localAddress = resolveLocalAddressByNetworkInterfaces();
      } catch (Exception e) {
        LOGGER.logWarning(e, "Failed to resolve local address by NetworkInterfaces");
      }
    }

    if (localAddress == null) {
      LOGGER.logWarning(
          "Failed to resolve local address by all means. " +
              "Fallback to loopback address");
      localAddress = (Inet4Address) Inet4Address.getLoopbackAddress();
    }

    LOGGER.logInfo("Resolved local address: [%s]", localAddress);

    return localAddress;
  }

  private static Inet4Address resolveLocalAddressByDatagramSocket() throws Exception {
    DatagramSocket socket = new DatagramSocket();

    // Initialize the local address which will be used to connect with the remote address.
    // It will automatically choose the preferred outbound IP address which should be external.
    // The remote address can be unreachable dummy address since there is no real
    // connection established here.
    socket.connect(Inet4Address.getByName("1.2.3.4"), 1234);
    return getUsableLocalAddress(socket.getLocalAddress());
  }

  private static Inet4Address resolveLocalAddressByInet4Address() throws Exception {
    return getUsableLocalAddress(Inet4Address.getLocalHost());
  }

  private static Inet4Address resolveLocalAddressByNetworkInterfaces() throws Exception {
    InetAddress localAddress = null;

    Enumeration nis = NetworkInterface.getNetworkInterfaces();
    while (localAddress == null && nis.hasMoreElements()) {
      NetworkInterface ni = (NetworkInterface) nis.nextElement();
      try {
        if (!ni.isLoopback() && ni.isUp() && ni.getHardwareAddress() != null) {
          Enumeration ips = ni.getInetAddresses();
          while (localAddress == null && ips.hasMoreElements()) {
            InetAddress ip = (InetAddress) ips.nextElement();
            if (isUsableLocalAddress(ip)) {
              localAddress = ip;
            }
          }
        }
      } catch (Exception e) {
        LOGGER.logWarning(e,
            "Failed to resolve local address by NetworkInterface: [%s]", ni);
      }
    }

    return getUsableLocalAddress(localAddress);
  }

  private static Inet4Address getUsableLocalAddress(InetAddress localAddress) throws Exception {
    if (isUsableLocalAddress(localAddress)) {
      return (Inet4Address) localAddress;
    } else {
      throw new Exception(String.format(
          "Local address [%s] is not usable", localAddress));
    }
  }

  private static boolean isUsableLocalAddress(InetAddress localAddress) {
    return localAddress instanceof Inet4Address &&
        !localAddress.isMulticastAddress() &&
        !localAddress.isLoopbackAddress() &&
        !localAddress.isAnyLocalAddress();
  }

  public static String getLocalHost() {
    return LOCAL_HOST;
  }

  public static String getLocalCanonicalHost() {
    return LOCAL_CANONICAL_HOST;
  }

  public static String getLocalIp() {
    return LOCAL_IP;
  }

  public static String resolveIp(String hostName) throws UnknownHostException {
    String trimmedHostName = hostName.trim();
    if (getLocalHost().equalsIgnoreCase(trimmedHostName) ||
        getLocalCanonicalHost().equalsIgnoreCase(trimmedHostName)) {
      return getLocalIp();
    } else {
      return Inet4Address.getByName(trimmedHostName).getHostAddress();
    }
  }
}
