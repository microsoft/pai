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

import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exceptions.TransientException;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.CompressionUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.retry.BoundedExponentialBackoffRetry;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ZooKeeperClient {
  private static final DefaultLogger LOGGER = new DefaultLogger(ZooKeeperClient.class);

  // Do not set to 1024 * 1024 in case java.io.IOException:
  // Len error 1048695 (org.apache.zookeeper.server.NIOServerCnxn)
  private static final int ZK_MAX_NODE_BYTES = 768 * 1024;
  private static final int ZK_MIN_COMPRESSION_BYTES = 10 * 1024;
  private static final String READY_PAYLOAD_VERSIONS_NODE_NAME = "ReadyPayloadVersions";
  private final CuratorFramework curator;

  public ZooKeeperClient(String connectString) {
    curator = CuratorFrameworkFactory.builder()
        .connectString(connectString)
        .connectionTimeoutMs(15000)
        .sessionTimeoutMs(60000)
        .retryPolicy(new BoundedExponentialBackoffRetry(1000, 60000, 10))
        .build();
    curator.start();
  }

  // ONLY for testing
  protected ZooKeeperClient() {
    curator = null;
  }

  public void stop() {
    curator.close();
  }

  private String create(String path, byte[] data, CreateMode mode) throws Exception {
    return curator.create().withMode(mode).forPath(path, data);
  }

  public Boolean exists(String path) throws Exception {
    return curator.checkExists().forPath(path) != null;
  }

  public List<String> getChildren(String path) throws Exception {
    return curator.getChildren().forPath(path);
  }

  private byte[] getData(String path) throws Exception {
    return curator.getData().forPath(path);
  }

  private void setData(String path, byte[] data) throws Exception {
    curator.setData().forPath(path, data);
  }

  // Create given node in given path, no matter the given path exist or not.
  // DISTRIBUTED THREAD SAFE
  private void createNode(String path, byte[] bytes) throws Exception {
    // Exception can not always happen, so we can always retry like CAS.
    while (true) {
      try {
        create(path, bytes, CreateMode.PERSISTENT);
        return;
      } catch (KeeperException.NodeExistsException existsException) {
        try {
          setData(path, bytes);
          return;
        } catch (KeeperException.NoNodeException notExistsException) {
        }
      }
    }
  }

  public void createPath(String path) throws Exception {
    createNode(path, new byte[0]);
  }

  private String createSequentialNode(String parentPath, byte[] bytes) throws Exception {
    String normalizedParentPath = ZookeeperStoreStructure.getNodePath(parentPath, "");
    String path = create(normalizedParentPath, bytes, CreateMode.PERSISTENT_SEQUENTIAL);
    return ZookeeperStoreStructure.getNodeName(path);
  }

  public String createSequentialPath(String parentPath) throws Exception {
    return createSequentialNode(parentPath, new byte[0]);
  }

  // Delete given node in given path, no matter the given path exist or not.
  // DISTRIBUTED THREAD SAFE
  public void deleteRecursively(String path) throws Exception {
    deleteRecursively(path, false);
  }

  public void deleteRecursively(String path, Boolean childrenOnly) throws Exception {
    List<String> children;

    try {
      children = getChildren(path);
    } catch (KeeperException.NoNodeException ignore) {
      return;
    }

    if (children != null) {
      for (String child : children) {
        deleteRecursively(ZookeeperStoreStructure.getNodePath(path, child), false);
      }
    }

    if (!childrenOnly) {
      try {
        curator.delete().forPath(path);
      } catch (KeeperException.NotEmptyException e) {
        // In case new children were created since getChildren
        deleteRecursively(path, false);
      } catch (KeeperException.NoNodeException ignore) {
      }
    }
  }

  // Set/Get small size (<= ZK_MAX_NODE_BYTES) object to the node of the given path, no matter the given path exist or not.
  // DISTRIBUTED THREAD SAFE
  public <T> void setSmallObject(String path, T obj) throws Exception {
    byte[] serializedObj = YamlUtils.toBytes(obj);

    long start = System.currentTimeMillis();

    byte[] payload;
    if (serializedObj.length >= ZK_MIN_COMPRESSION_BYTES) {
      payload = CompressionUtils.compress(serializedObj);
    } else {
      payload = serializedObj;
    }
    createNode(path, payload);

    long end = System.currentTimeMillis();
    LOGGER.logTrace("setSmallObject with %s bytes on path %s in %sms.",
        serializedObj.length, path, end - start);
  }

  // DISTRIBUTED THREAD SAFE
  public <T> T getSmallObject(String path, Class<T> classRef) throws Exception {
    long start = System.currentTimeMillis();

    byte[] serializedObj = CompressionUtils.decompress(getData(path));

    long end = System.currentTimeMillis();
    LOGGER.logTrace("getSmallObject with %s bytes on path %s in %sms.",
        serializedObj.length, path, end - start);

    return YamlUtils.toObject(serializedObj, classRef);
  }

  // Set/Get large size (> ZK_MAX_NODE_BYTES) object to the node of the given path, no matter the given path exist or not.
  // Note the node of the given path can only be leaf node.
  // DISTRIBUTED THREAD SAFE and Atomic like getSmallObject
  public <T> void setLargeObject(String path, T obj) throws Exception {
    byte[] serializedObj = YamlUtils.toBytes(obj);

    long start = System.currentTimeMillis();

    byte[] payload;
    if (serializedObj.length >= ZK_MIN_COMPRESSION_BYTES) {
      payload = CompressionUtils.compress(serializedObj);
    } else {
      payload = serializedObj;
    }

    // Prepare internal ZookeeperStoreStructure for LargeObject
    if (!exists(path)) {
      createPath(path);
    }

    // ReadyPayloadVersionsRootPath is used to store ReadyPayloadVersions whose Payload has been Set, i.e. Path/ReadyPayloadVersions
    // At any time, we can guarantee that:
    //  The Payload of the latest ReadyPayloadVersion is complete.
    // Note:
    //  The Payload of not the latest ReadyPayloadVersion may be incomplete.
    //  Such as in case that new Payload GC old Payload before the old PayloadVersion add under ReadyPayloadVersionsRootPath.
    String readyPayloadVersionsRootPath = ZookeeperStoreStructure.getNodePath(path, READY_PAYLOAD_VERSIONS_NODE_NAME);
    if (!exists(readyPayloadVersionsRootPath)) {
      createPath(readyPayloadVersionsRootPath);
    }

    // Generate new PayloadVersion for this Payload
    String payloadVersion = createSequentialPath(path);

    // PayloadRootPath is already cleaned and created in createSequentialPath, i.e. Path/{PayloadVersion}
    String payloadRootPath = ZookeeperStoreStructure.getNodePath(path, payloadVersion);

    // Split and Set Payload
    try {
      for (int partStartOffset = 0; partStartOffset < payload.length; partStartOffset += ZK_MAX_NODE_BYTES) {
        // Split Payload by ZK_MAX_NODE_BYTES to PayloadParts
        // PayloadPart: {partIndex : [partStartOffset, partEndOffset)}
        int partEndOffset = Math.min(payload.length, partStartOffset + ZK_MAX_NODE_BYTES);
        int partBytes = partEndOffset - partStartOffset;
        byte[] payloadPart = CommonUtils.subArray(payload, partStartOffset, partBytes);

        // Set each PayloadParts into corresponding PayloadPartPath, i.e. Path/{PayloadVersion}/{PayLoadPartIndex}
        Integer partIndex = partStartOffset / ZK_MAX_NODE_BYTES;
        String partIndexStr = partIndex.toString();
        String partIndexPath = ZookeeperStoreStructure.getNodePath(payloadRootPath, partIndexStr);
        createNode(partIndexPath, payloadPart);
      }
    } catch (KeeperException.NoNodeException e) {
      LOGGER.logWarning(e,
          "Failed to Set PayloadParts under Path %s due to NoNode ZkException. " +
              "There should be a newer version Payload, so give up here",
          payloadRootPath);
      return;
    }

    // Add PayloadVersion under ReadyPayloadVersionsRootPath, i.e. Path/ReadyPayloadVersions/{PayloadVersion}
    addNewVersion(readyPayloadVersionsRootPath, payloadVersion);

    // First GC old PayloadVersion under ReadyPayloadVersionsRootPath, then GC old Payload under Path
    gcOldVersions(readyPayloadVersionsRootPath, payloadVersion, null);
    gcOldVersions(path, payloadVersion, new HashSet<>(Collections.singletonList(READY_PAYLOAD_VERSIONS_NODE_NAME)));

    long end = System.currentTimeMillis();
    LOGGER.logTrace("setLargeObject with %s bytes on path %s in %sms.",
        serializedObj.length, path, end - start);
  }

  private void addNewVersion(String versionsRootPath, String newVersion) throws Exception {
    createPath(ZookeeperStoreStructure.getNodePath(versionsRootPath, newVersion));
  }

  // Try best to GC old version nodes under versionsRootPath and return the failed GC Versions
  private void gcOldVersions(
      String versionsRootPath,
      String currentVersion,
      Set<String> excludeNodeNames) throws Exception {
    Long currentVersionInt = Long.parseLong(currentVersion);
    for (String version : getChildren(versionsRootPath)) {
      if (excludeNodeNames != null && excludeNodeNames.contains(version)) {
        continue;
      }

      String versionPath = ZookeeperStoreStructure.getNodePath(versionsRootPath, version);

      // Judge whether should GC versionPath
      Boolean shouldGC = false;
      try {
        Long versionInt = Long.parseLong(version);
        if (versionInt < currentVersionInt) {
          shouldGC = true;
        }
      } catch (Exception e) {
        LOGGER.logDebug(e, "Failed to Parse version at VersionPath %s, it should be a garbage node to GC", versionPath);
        shouldGC = true;
      }

      if (shouldGC) {
        try {
          deleteRecursively(versionPath);
        } catch (KeeperException.NoNodeException ignored) {
        } catch (Exception e) {
          LOGGER.logDebug(e, "Failed to Delete old version node under VersionPath %s", versionPath);
        }
      }
    }
  }

  private static String getLatestVersion(ZooKeeperClient zkClient, String versionsRootPath) {
    String latestVersion = null;
    Long latestVersionInt = 0L;
    try {
      for (String version : zkClient.getChildren(versionsRootPath)) {
        Long versionInt = Long.parseLong(version);
        if (versionInt >= latestVersionInt) {
          latestVersionInt = versionInt;
          latestVersion = version;
        }
      }
    } catch (Exception ignored) {
    }

    return latestVersion;
  }


  // DISTRIBUTED THREAD SAFE and Atomic like getSmallObject
  public <T> T getLargeObject(String path, Class<T> classRef) throws Exception {
    // Get the Payload of the latest ReadyPayloadVersion which is complete.
    while (true) {
      try {
        return getLargeObjectInternal(this, path, classRef);
      } catch (TransientException e) {
        LOGGER.logWarning(e, "TransientException occurred during getLargeObject, will retry again.");
      }
    }
  }

  private static <T> T getLargeObjectInternal(ZooKeeperClient zkClient, String path, Class<T> classRef) throws Exception {
    long start = System.currentTimeMillis();

    // Get the latest ReadyPayloadVersion as CompletePayloadVersion
    String readyPayloadVersionsRootPath = ZookeeperStoreStructure.getNodePath(path, READY_PAYLOAD_VERSIONS_NODE_NAME);
    String completePayloadVersion = getLatestVersion(zkClient, readyPayloadVersionsRootPath);
    if (completePayloadVersion == null) {
      LOGGER.logWarning(
          "Failed to find any valid version under VersionPath %s when getLatestVersion.",
          readyPayloadVersionsRootPath);

      throw new KeeperException.NoNodeException("No node found in Zookeeper.");
    }

    // Get PayloadParts from all child nodes under Path/{PayloadRootPath}/
    String payloadRootPath = ZookeeperStoreStructure.getNodePath(path, completePayloadVersion);
    byte[] payload = new byte[0];
    Boolean isCorrupt = false;
    try {
      List<String> partIndexStrs = zkClient.getChildren(payloadRootPath);
      for (Integer partIndex = 0; partIndex < partIndexStrs.size(); partIndex++) {
        // Get each PayloadParts in PayloadPartPath, i.e. Path/{PayloadRootPath}/{PayLoadPartIndex}
        String partIndexStr = partIndex.toString();
        if (!partIndexStrs.contains(partIndexStr)) {
          isCorrupt = true;
          break;
        }

        String partIndexPath = ZookeeperStoreStructure.getNodePath(payloadRootPath, partIndexStr);
        byte[] payloadPart = zkClient.getData(partIndexPath);
        payload = CommonUtils.concatArrays(payload, payloadPart);
      }
    } catch (KeeperException.NoNodeException e) {
      LOGGER.logWarning(e,
          "Got corrupt Payload under Path %s, will judge whether it is Transient",
          payloadRootPath);
      isCorrupt = true;
    }

    // Check whether the CompletePayloadVersion is changed during Get PayloadParts.
    String completePayloadVersionAfterGet = getLatestVersion(zkClient, readyPayloadVersionsRootPath);
    if (!completePayloadVersion.equals(completePayloadVersionAfterGet)) {
      // Only throw TransientException and then always retry for the CompletePayloadVersion changes.
      // And the changes can not always happen, so we can always retry like CAS.
      throw new TransientException(
          String.format("The CompletePayloadVersion %s changed to %s after Get PayloadParts. " +
                  "There may be incomplete PayloadParts under Path %s.",
              completePayloadVersion,
              completePayloadVersionAfterGet,
              payloadRootPath));
    }

    if (isCorrupt) {
      throw new NonTransientException(
          String.format("Got corrupt Payload under Path %s, " +
                  "but it is still the CompletePayloadVersion after Get PayloadParts, it should be corrupt permanently.",
              payloadRootPath));
    }

    byte[] serializedObj = CompressionUtils.decompress(payload);

    long end = System.currentTimeMillis();
    LOGGER.logTrace("getLargeObject with %s bytes on path %s in %sms.",
        serializedObj.length, path, end - start);

    return YamlUtils.toObject(serializedObj, classRef);
  }
}
