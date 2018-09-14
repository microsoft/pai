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

package com.microsoft.frameworklauncher.zookeeperstore;

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.apache.log4j.Level;
import org.apache.zookeeper.KeeperException;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MockZooKeeperClient extends ZooKeeperClient {
  private static final DefaultLogger LOGGER = new DefaultLogger(MockZooKeeperClient.class);

  @Override
  public <T> void setSmallObject(String path, T obj)
      throws IOException {
    String yamlPath = path + ".yml";
    createFile(yamlPath);
    YamlUtils.toFile(obj, yamlPath);
  }

  @Override
  public <T> T getSmallObject(String path, Class<T> classRef) throws Exception {
    try {
      return YamlUtils.toObject(path + ".yml", classRef);
    } catch (FileNotFoundException e) {
      throw new KeeperException.NoNodeException();
    }
  }

  @Override
  public <T> void setLargeObject(String path, T obj) throws Exception {
    setSmallObject(path, obj);
  }

  @Override
  public <T> T getLargeObject(String path, Class<T> classRef) throws Exception {
    return getSmallObject(path, classRef);
  }

  @Override
  public void deleteRecursively(String path, Boolean childrenOnly) throws Exception {
    File file = new File(path);
    if (file.isDirectory()) {
      File[] subFiles = file.listFiles();
      for (File subFile : subFiles) {
        deleteRecursively(subFile.getAbsolutePath(), false);
      }
    }

    if (!childrenOnly) {
      file.delete();
    }
  }

  @Override
  public Boolean exists(String path) throws Exception {
    return new File(path + ".yml").exists();
  }

  @Override
  public List<String> getChildren(String path) throws Exception {
    File file = new File(path);
    String[] children = file.list();
    if (children == null || children.length == 0) {
      return new ArrayList<>();
    }
    return Arrays.asList(children);
  }

  public void createFile(String path) {
    File file = new File(path);
    if (!file.exists()) {
      createPath(file.getParent());
      try {
        file.createNewFile();
      } catch (IOException e) {
        LOGGER.log(e, Level.ERROR);
      }
    }
  }

  @Override
  public void createPath(String path) {
    File file = new File(path);
    if (!file.exists()) {
      createPath(file.getParent());
      file.mkdir();
    }
  }

}
