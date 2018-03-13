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

import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.representer.Representer;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

public class YamlUtils {
  // Bytes <-> Yaml
  public static <T> T toObject(byte[] bytes, Class<T> classRef) {
    Representer representer = new Representer();
    representer.getPropertyUtils().setSkipMissingProperties(true);
    Yaml yaml = new Yaml(new Constructor(classRef), representer);
    return yaml.loadAs(new String(bytes), classRef);
  }

  public static <T> T toObject(String fileName, Class<T> classRef) throws FileNotFoundException {
    Representer representer = new Representer();
    representer.getPropertyUtils().setSkipMissingProperties(true);
    Yaml yaml = new Yaml(new Constructor(classRef), representer);
    return yaml.loadAs(new FileReader(fileName), classRef);
  }

  public static <T> byte[] toBytes(T obj) {
    Yaml yaml = new Yaml();
    return yaml.dump(obj).getBytes();
  }

  public static <T> void toFile(T obj, String fileName) throws IOException {
    Yaml yaml = new Yaml();
    yaml.dump(obj, new FileWriter(fileName));
  }

  public static <T> T deepCopy(T obj, Class<T> classRef) {
    return toObject(toBytes(obj), classRef);
  }

  public static <T> Boolean deepEquals(T obj, T otherObj) {
    if (obj == null && otherObj == null) {
      return true;
    }
    if (obj == null || otherObj == null) {
      return false;
    }
    return Arrays.equals(toBytes(obj), toBytes(otherObj));
  }

  public static <TKey, TValue> Boolean deepEquals(
      Map<TKey, TValue> yamlDict, Map<TKey, TValue> otherYamlDict) {
    if (yamlDict == otherYamlDict) {
      return true;
    }
    if (yamlDict == null || otherYamlDict == null) {
      return false;
    }
    if (yamlDict.size() != otherYamlDict.size()) {
      return false;
    }

    for (Map.Entry<TKey, TValue> kvp : yamlDict.entrySet()) {
      TValue value = kvp.getValue();
      if (!otherYamlDict.containsKey(kvp.getKey())) {
        return false;
      }
      TValue otherValue = otherYamlDict.get(kvp.getKey());
      if (!deepEquals(value, otherValue)) {
        return false;
      }
    }
    return true;
  }
}
