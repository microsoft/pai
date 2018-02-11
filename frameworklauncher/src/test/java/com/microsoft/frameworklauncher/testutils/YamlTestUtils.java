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

package com.microsoft.frameworklauncher.testutils;

import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.junit.Assert;

import java.io.File;
import java.lang.reflect.*;
import java.util.*;

public class YamlTestUtils {
  private static List<String> basicTypeClass = Arrays.asList(
      "java.lang.Integer",
      "java.lang.Long", "java.lang.Float",
      "java.lang.Boolean", "java.lang.String");

  private static List<String> parameterizedTypeClass = Arrays.asList(
      "java.util.Map", "java.util.List", "java.util.Set");

  private static final Integer INIT_INT = 0;
  private static final Long INIT_Long = 0L;
  private static final Float INIT_FLOAT = 0.0F;
  private static final Boolean INIT_BOOLEAN = false;
  private static final String INIT_STRING = "testString";

  public static final String EXPECTS_DIR =
      TestUtils.RESOURCE_ROOT + File.separator + "TestExpects" + File.separator;
  public static final String INPUTS_DIR =
      TestUtils.RESOURCE_ROOT + File.separator + "TestInputs" + File.separator;
  public static final String RESULTS_DIR =
      TestUtils.RESOURCE_ROOT + File.separator + "TestResults" + File.separator;

  static {
    new File(RESULTS_DIR).mkdir();
  }

  public static <T> void testObjectToYaml(T object, String configFileName, Class<T> tClass)
      throws Exception {
    String resultFilePath = RESULTS_DIR + configFileName + ".yml";

    // Read Result: Object -> Yaml
    YamlUtils.toFile(object, resultFilePath);
    String resultYamlForDebug = CommonUtils.readFile(resultFilePath);
    System.out.println(new Date());
    System.out.println(resultYamlForDebug);

    // Read Expect: Yaml -> Object
    T resultObjectFromFile = YamlUtils.toObject(resultFilePath, tClass);

    // Compare Result and Expect
    Assert.assertTrue(
        String.format("%s: Test result and expect do not match!", configFileName),
        YamlUtils.deepEquals(object, resultObjectFromFile));

    // Test Byte <-> Object
    T resultObjectFromBytes = YamlUtils.toObject(YamlUtils.toBytes(object), tClass);
    Assert.assertTrue(
        String.format("%s: Test result and expect do not match!", configFileName),
        YamlUtils.deepEquals(object, resultObjectFromBytes));

  }

  public static <T> void testField(String yamlFilePath, Class<T> tClass)
      throws Exception {
    // Read Expect: Yaml -> Object
    T resultObjectFromFile = YamlUtils.toObject(yamlFilePath, tClass);
  }

  public static <T> void testClasses(Class<T> tClass) throws Exception {
    String configFileName = tClass.getSimpleName();
    // Create new instance;
    T t = newInstance(tClass);
    testObjectToYaml(t, configFileName, tClass);
  }

  public static <T> T newInstance(Class<T> tClass) throws Exception {
    if (basicTypeClass.contains(tClass.getName())) {
      return basicTypeInit(tClass);
    }

    T t = tClass.newInstance();
    for (Field field : tClass.getDeclaredFields()) {
      if (Modifier.isStatic(field.getModifiers()))
        continue;

      Class<?> c = field.getType();
      if (c.isEnum()) {
        continue;
      }

      // Test setter and getter
      try {
        Method setMethod = tClass.getMethod(methodName("set", field.getName()), c);
        if (c.getName().equals("boolean")) {
          Method getMethod = tClass.getMethod(methodName("is", field.getName()));
        } else {
          Method getMethod = tClass.getMethod(methodName("get", field.getName()));
        }

        String cName = c.getName();
        if (parameterizedTypeClass.contains(cName)) {
          setMethod.invoke(t, parameterizedTypeClassInit(
              (ParameterizedType) field.getGenericType(), c));
        } else if (cName.startsWith("com.microsoft.frameworklauncher.common.model")
            || basicTypeClass.contains(cName)) {
          setMethod.invoke(t, newInstance(c));
        }
      } catch (NoSuchMethodException e) {
        Assert.fail(
            String.format("No getter or setter method for %s in %s",
                field.getName(), tClass.getSimpleName()));
      }
    }
    return t;
  }

  @SuppressWarnings("unchecked")
  public static <T> T basicTypeInit(Class<T> tClass) {
    int idx = basicTypeClass.indexOf(tClass.getName());
    switch (idx) {
      case 0:
        return (T) INIT_INT;
      case 1:
        return (T) INIT_Long;
      case 2:
        return (T) INIT_FLOAT;
      case 3:
        return (T) INIT_BOOLEAN;
      case 4:
        return (T) INIT_STRING;
    }
    return null;
  }

  public static <T> T parameterizedTypeClassInit(
      ParameterizedType parameterizedType, Class<T> tClass) throws Exception {
    int idx = parameterizedTypeClass.indexOf(tClass.getName());
    switch (idx) {
      case 0:
        return (T) mapTypeInit(parameterizedType);
      case 1:
        return (T) listTypeInit(parameterizedType);
      case 2:
        return (T) setTypeInit(parameterizedType);
    }
    return null;
  }

  public static List listTypeInit(ParameterizedType parameterizedType)
      throws Exception {
    Type[] actualTypeArguments = parameterizedType.getActualTypeArguments();
    List list = new ArrayList();
    list.add(newInstance((Class) actualTypeArguments[0]));

    return list;
  }

  public static Map mapTypeInit(ParameterizedType parameterizedType)
      throws Exception {
    Type[] actualTypeArguments = parameterizedType.getActualTypeArguments();
    Map map = new HashMap();
    map.put(newInstance((Class) actualTypeArguments[0]),
        newInstance((Class) actualTypeArguments[1]));

    return map;
  }

  public static Set setTypeInit(ParameterizedType parameterizedType)
      throws Exception {
    Type[] actualTypeArguments = parameterizedType.getActualTypeArguments();
    Set set = new HashSet();
    set.add(newInstance((Class) actualTypeArguments[0]));

    return set;
  }

  public static String methodName(String prefix, String fieldName) {
    char c = fieldName.charAt(0);
    char upperChar = Character.isUpperCase(c) ? c : (char) (c + 'A' - 'a');
    return prefix + upperChar + fieldName.substring(1);
  }
}
