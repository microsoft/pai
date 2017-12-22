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

package com.microsoft.frameworklauncher.common.model;

import com.microsoft.frameworklauncher.utils.DefaultLogger;
import org.apache.hadoop.yarn.api.records.Resource;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public class ResourceDescriptor implements Serializable {
  private static final DefaultLogger LOGGER = new DefaultLogger(ResourceDescriptor.class);

  @Valid
  @NotNull
  private Integer cpuNumber;

  @Valid
  @NotNull
  private Integer memoryMB;

  @Valid
  @NotNull
  private List<Range> portRanges = new ArrayList<>();

  @Valid
  @NotNull
  private DiskType diskType = DiskType.HDD;

  @Valid
  @NotNull
  private Integer diskMB = 0;

  @Valid
  @NotNull
  private Long gpuAttribute = 0L;

  @Valid
  @NotNull
  private Integer gpuNumber = 0;

  public Integer getCpuNumber() {
    return cpuNumber;
  }

  public void setCpuNumber(Integer cpuNumber) {
    this.cpuNumber = cpuNumber;
  }

  public Integer getMemoryMB() {
    return memoryMB;
  }

  public void setMemoryMB(Integer memoryMB) {
    this.memoryMB = memoryMB;
  }

  public List<Range> getPortRanges() {
    return portRanges;
  }

  public void setPortRanges(List<Range> portRanges) {
    this.portRanges = portRanges;
  }

  public DiskType getDiskType() {
    return diskType;
  }

  public void setDiskType(DiskType diskType) {
    this.diskType = diskType;
  }

  public Integer getDiskMB() {
    return diskMB;
  }

  public void setDiskMB(Integer diskMB) {
    this.diskMB = diskMB;
  }

  public Integer getGpuNumber() {
    return gpuNumber;
  }

  public void setGpuNumber(Integer gpuNumber) {
    this.gpuNumber = gpuNumber;
  }

  public Long getGpuAttribute() {
    return gpuAttribute;
  }

  public void setGpuAttribute(Long gpuAttribute) {
    this.gpuAttribute = gpuAttribute;
  }

  public static ResourceDescriptor newInstance(Integer memoryMB, Integer cpuNumber, Integer gpuNumber, Long gpuAttribute) {
    ResourceDescriptor resource = new ResourceDescriptor();
    resource.setMemoryMB(memoryMB);
    resource.setCpuNumber(cpuNumber);
    resource.setGpuNumber(gpuNumber);
    resource.setGpuAttribute(gpuAttribute);
    return resource;
  }

  public static ResourceDescriptor fromResource(Resource res) throws Exception {
    ResourceDescriptor rd = new ResourceDescriptor();
    rd.setMemoryMB(res.getMemory());
    rd.setCpuNumber(res.getVirtualCores());
    rd.setGpuAttribute(0L);
    rd.setGpuNumber(0);

    try {
      Class<?> clazz = res.getClass();
      Method getGpuNumber = clazz.getMethod("getGPUs");
      Method getGpuAtrribute = clazz.getMethod("getGPUAttribute");

      rd.setGpuNumber((int) getGpuNumber.invoke(res));
      rd.setGpuAttribute((long) getGpuAtrribute.invoke(res));
    } catch (NoSuchMethodException e) {
      LOGGER.logDebug(e, "Ignore: Fail get GPU information, YARN library doesn't support gpu as resources");
    } catch (IllegalAccessException e) {
      LOGGER.logError(e, "Ignore: Fail to get GPU information, illegal access function");
    }
    return rd;
  }

  public Resource toResource() throws Exception {
    Resource res = Resource.newInstance(memoryMB, cpuNumber);

    if (gpuNumber > 0) {
      try {
        Class<?> clazz = res.getClass();
        Method setGpuNumber = clazz.getMethod("setGPUs", int.class);
        Method setGpuAttribute = clazz.getMethod("setGPUAttribute", long.class);

        setGpuNumber.invoke(res, gpuNumber);
        setGpuAttribute.invoke(res, gpuAttribute);
      } catch (NoSuchMethodException e) {
        LOGGER.logWarning(e, "Ignore: Fail to set GPU information, YARN library doesn't support:");
      } catch (IllegalAccessException e) {
        LOGGER.logError(e, "Ignore: Fail to set GPU information, illegal access function");
      }
    }
    return res;
  }

  @Override
  public String toString() {
    return String.format("[MemoryMB: [%s]", getMemoryMB()) + " " +
        String.format("CpuNumber: [%s]", getCpuNumber()) + " " +
        String.format("GpuNumber: [%s]", getGpuNumber()) + " " +
        String.format("GpuAttribute: [%s]]", getGpuAttribute());
  }
}
