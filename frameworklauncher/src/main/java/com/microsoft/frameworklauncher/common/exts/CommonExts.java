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

package com.microsoft.frameworklauncher.common.exts;

import java.util.*;

public class CommonExts {
  public interface VoidCallable {
    void call() throws Exception;
  }

  public interface NoExceptionCallable<V> {
    V call();
  }

  public static <TKey, TValue> Map<TKey, TValue> asReadOnly(Map<TKey, TValue> dict) {
    return Collections.unmodifiableMap(dict);
  }

  public static String toStringWithBits(Long l) {
    String dStr = String.format("%s", l);
    String bStr;
    if (l == null) {
      bStr = dStr;
    } else {
      bStr = Long.toBinaryString(l);
    }
    return String.format("%s(%s)", dStr, bStr);
  }

  public static <K, V> String toString(Map<K, V> kvMap) {
    StringBuilder str = new StringBuilder();
    if (kvMap != null) {
      for (Map.Entry<K, V> e : kvMap.entrySet()) {
        if (str.length() != 0) {
          str.append(", ");
        }
        str.append("<" + e.getKey() + " = " + e.getValue() + ">");
      }
    }
    return "{" + str.toString() + "}";
  }

  public static <T> String toString(Collection<T> collection) {
    StringBuilder str = new StringBuilder();
    if (collection != null) {
      for (T e : collection) {
        if (str.length() != 0) {
          str.append(", ");
        }
        str.append(e);
      }
    }
    return "{" + str.toString() + "}";
  }

  public static <T> Boolean equals(List<T> first, List<T> second) {
    if (first == second) {
      return true;
    }
    if (first == null || second == null) {
      return false;
    }
    if (first.size() != second.size()) {
      return false;
    }

    for (int i = 0; i < first.size(); i++) {
      if (!first.get(i).equals(second.get(i))) {
        return false;
      }
    }

    return true;
  }

  public static <T> Boolean equals(Set<T> first, Set<T> second) {
    if (first == second) {
      return true;
    }
    if (first == null || second == null) {
      return false;
    }
    if (first.size() != second.size()) {
      return false;
    }

    for (T value : first) {
      if (!second.contains(value)) {
        return false;
      }
    }

    return true;
  }

  public static <TKey, TValue> Boolean equals(Map<TKey, TValue> first, Map<TKey, TValue> second) {
    if (first == second) {
      return true;
    }
    if (first == null || second == null) {
      return false;
    }
    if (first.size() != second.size()) {
      return false;
    }

    for (Map.Entry<TKey, TValue> kvp : first.entrySet()) {
      TValue firstValue = kvp.getValue();
      if (!second.containsKey(kvp.getKey())) {
        return false;
      }
      TValue secondValue = second.get(kvp.getKey());
      if (!firstValue.equals(secondValue)) {
        return false;
      }
    }

    return true;
  }
}
