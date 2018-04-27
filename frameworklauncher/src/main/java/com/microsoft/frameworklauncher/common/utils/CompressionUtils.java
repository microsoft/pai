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
import org.apache.commons.io.IOUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class CompressionUtils {
  private static final DefaultLogger LOGGER = new DefaultLogger(CompressionUtils.class);

  public static byte[] compress(byte[] bytes) throws IOException {
    long start = System.currentTimeMillis();

    try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
      try (GZIPOutputStream zos = new GZIPOutputStream(bos)) {
        zos.write(bytes);
      }
      byte[] compressedBytes = bos.toByteArray();

      long end = System.currentTimeMillis();
      LOGGER.logTrace("Compressed from %s bytes to %s bytes in %sms.",
          bytes.length, compressedBytes.length, end - start);
      return compressedBytes;
    }
  }

  // Works for both decompressed and compressed bytes
  public static byte[] decompress(byte[] bytes) throws IOException {
    if (!isCompressed(bytes)) {
      LOGGER.logTrace("Found already decompressed bytes. Ignore it.");
      return bytes;
    }

    long start = System.currentTimeMillis();

    try (ByteArrayInputStream bis = new ByteArrayInputStream(bytes)) {
      try (GZIPInputStream gis = new GZIPInputStream(bis)) {
        byte[] decompressedBytes = IOUtils.toByteArray(gis);

        long end = System.currentTimeMillis();
        LOGGER.logTrace("Decompressed from %s bytes to %s bytes in %sms.",
            bytes.length, decompressedBytes.length, end - start);
        return decompressedBytes;
      }
    }
  }

  public static boolean isCompressed(byte[] bytes) {
    // It can judge serialized YAML string correctly, since the YARM string
    // header !!(0x2121) always does not equal to GZIP_MAGIC(0x8b1f).
    return CommonUtils.bytesToShort(bytes) == GZIPInputStream.GZIP_MAGIC;
  }
}