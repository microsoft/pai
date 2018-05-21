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

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.PortUtils;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.validation.MapKeyNamingValidation;
import com.microsoft.frameworklauncher.common.validation.MapValueNotNullValidation;
import org.apache.hadoop.yarn.api.records.Resource;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ResourceDescriptor implements Serializable {
  private static final DefaultLogger LOGGER = new DefaultLogger(ResourceDescriptor.class);
  private static final boolean HADOOP_LIBRARY_SUPPORTS_GPU = checkHadoopLibrarySupportsGpuInternal();
  private static final boolean HADOOP_LIBRARY_SUPPORTS_PORT = checkHadoopLibrarySupportsPortInternal();

  @Valid
  @NotNull
  @Min(1)
  private Integer cpuNumber;

  @Valid
  @NotNull
  @Min(1)
  private Integer memoryMB;

  @Valid
  @NotNull
  @MapKeyNamingValidation
  @MapValueNotNullValidation
  private Map<String, Ports> portDefinitions = new HashMap<>();

  @JsonIgnore
  // It is internal StateVariable which should not be exposed outside by Json.
  private List<ValueRange> portRanges = new ArrayList<>();

  @JsonIgnore
  // It is internal StateVariable which should not be exposed outside by Json.
  private Integer portNumber = 0;

  @Valid
  @NotNull
  private DiskType diskType = DiskType.HDD;

  @Valid
  @NotNull
  @Min(0)
  private Integer diskMB = 0;

  @Valid
  @NotNull
  @Min(0)
  private Integer gpuNumber = 0;

  @Valid
  @NotNull
  @Min(0)
  private Long gpuAttribute = 0L;

  public static ResourceDescriptor newInstance(
      Integer memoryMB, Integer cpuNumber) {
    return ResourceDescriptor.newInstance(memoryMB, cpuNumber, 0, 0L);
  }

  public static ResourceDescriptor newInstance(
      Integer memoryMB, Integer cpuNumber,
      Integer gpuNumber, Long gpuAttribute) {
    return ResourceDescriptor.newInstance(
        memoryMB, cpuNumber, gpuNumber, gpuAttribute, 0, new ArrayList<>());
  }

  public static ResourceDescriptor newInstance(
      Integer memoryMB, Integer cpuNumber,
      Integer gpuNumber, Long gpuAttribute,
      int portNumber, List<ValueRange> portRanges) {
    ResourceDescriptor resource = new ResourceDescriptor();
    resource.setMemoryMB(memoryMB);
    resource.setCpuNumber(cpuNumber);
    resource.setGpuNumber(gpuNumber);
    resource.setGpuAttribute(gpuAttribute);
    resource.setPortNumber(portNumber);
    resource.setPortRanges(portRanges);
    return resource;
  }

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

  public Map<String, Ports> getPortDefinitions() {
    return portDefinitions;
  }

  public void setPortDefinitions(Map<String, Ports> portDefinitions) {
    this.portDefinitions = portDefinitions;

    // Convert outside exposed portDefinitions to internal portRanges and portNumber
    // to facilitate internal usage.
    // Note setPortDefinitions may be called before validation, so need to check preconditions
    if (portDefinitions == null) {
      return;
    }
    setPortRanges(PortUtils.getStaticPortRanges(portDefinitions));
    setPortNumber(PortUtils.getDynamicPortNumber(portDefinitions));
  }

  public List<ValueRange> getPortRanges() {
    return portRanges;
  }

  public void setPortRanges(List<ValueRange> portRanges) {
    this.portRanges = portRanges;
  }

  public Integer getPortNumber() {
    return portNumber;
  }

  public void setPortNumber(Integer portNumber) {
    this.portNumber = portNumber;
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

  public static ResourceDescriptor fromResource(Resource res) throws Exception {
    ResourceDescriptor rd = new ResourceDescriptor();
    rd.setMemoryMB(res.getMemory());
    rd.setCpuNumber(res.getVirtualCores());
    Class<?> clazz = res.getClass();

    if (HADOOP_LIBRARY_SUPPORTS_GPU) {
      Method getGpuNumber = clazz.getMethod("getGPUs");
      Method getGpuAttribute = clazz.getMethod("getGPUAttribute");

      rd.setGpuNumber((int) getGpuNumber.invoke(res));
      rd.setGpuAttribute((long) getGpuAttribute.invoke(res));
    }

    if (HADOOP_LIBRARY_SUPPORTS_PORT) {
      Class<?> hadoopValueRangesClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRanges");
      Class<?> hadoopValueRangeClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRange");
      Method getPorts = clazz.getMethod("getPorts");

      Object hadoopValueRanges = getPorts.invoke(res);
      if (hadoopValueRanges != null) {
        Method getBegin = hadoopValueRangeClass.getMethod("getBegin");
        Method getEnd = hadoopValueRangeClass.getMethod("getEnd");

        Method getSortedRangesList = hadoopValueRangesClass.getMethod("getSortedRangesList");
        List hadoopValueRangeList = (List) getSortedRangesList.invoke(hadoopValueRanges);

        List<ValueRange> rangeList = new ArrayList<>();
        for (Object hadoopRange : hadoopValueRangeList) {
          ValueRange range = new ValueRange();
          range.setBegin((int) getBegin.invoke(hadoopRange));
          range.setEnd((int) getEnd.invoke(hadoopRange));
          rangeList.add(range);
        }
        rd.setPortRanges(rangeList);
      }
    }

    LOGGER.logDebug("Converted ResourceDescriptor: " + rd + " from Resource: " + res);
    return rd;
  }

  public Resource toResource() throws Exception {
    Resource res = Resource.newInstance(getMemoryMB(), getCpuNumber());
    Class<?> clazz = res.getClass();

    if (HADOOP_LIBRARY_SUPPORTS_GPU && getGpuNumber() > 0) {
      Method setGpuNumber = clazz.getMethod("setGPUs", int.class);
      Method setGpuAttribute = clazz.getMethod("setGPUAttribute", long.class);

      setGpuNumber.invoke(res, getGpuNumber());
      setGpuAttribute.invoke(res, getGpuAttribute());
    }

    if (HADOOP_LIBRARY_SUPPORTS_PORT && getPortRanges().size() > 0) {
      Class<?> hadoopValueRangesClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRanges");
      Class<?> hadoopValueRangeClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRange");

      List<Object> hadoopValueRangeList = new ArrayList<>();
      for (ValueRange range : getPortRanges()) {
        Object valueRangeObj = hadoopValueRangeClass.getMethod("newInstance", int.class, int.class)
            .invoke(null, range.getBegin(), range.getEnd());
        hadoopValueRangeList.add(valueRangeObj);
      }

      Object obj = hadoopValueRangesClass.getMethod("newInstance").invoke(null);
      Method setRangesList = hadoopValueRangesClass.getMethod("setRangesList", List.class);
      setRangesList.invoke(obj, hadoopValueRangeList);
      Method setPorts = clazz.getMethod("setPorts", hadoopValueRangesClass);
      setPorts.invoke(res, obj);
    }

    LOGGER.logDebug("Converted ResourceDescriptor: " + this + " to Resource: " + res);
    return res;
  }

  public static boolean checkHadoopLibrarySupportsGpu() {
    return HADOOP_LIBRARY_SUPPORTS_GPU;
  }

  private static boolean checkHadoopLibrarySupportsGpuInternal() {
    Class<?> clazz = Resource.newInstance(0, 0).getClass();
    try {
      clazz.getMethod("setGPUs", int.class);
      clazz.getMethod("setGPUAttribute", long.class);
    } catch (NoSuchMethodException e) {
      LOGGER.logDebug(e, "Local hadoop library doesn't support Gpu.");
      return false;
    }
    return true;
  }

  public static boolean checkHadoopLibrarySupportsPort() {
    return HADOOP_LIBRARY_SUPPORTS_PORT;
  }

  private static boolean checkHadoopLibrarySupportsPortInternal() {
    Class<?> clazz = Resource.newInstance(0, 0).getClass();
    try {
      Class<?> hadoopValueRangesClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRanges");
      Class<?> hadoopValueRangeClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRange");
      hadoopValueRangesClass.getMethod("newInstance");
      hadoopValueRangeClass.getMethod("newInstance", int.class, int.class);
      hadoopValueRangesClass.getMethod("setRangesList", List.class);
      clazz.getMethod("setPorts", hadoopValueRangesClass);
    } catch (NoSuchMethodException | ClassNotFoundException e) {
      LOGGER.logDebug(e, "Local hadoop library doesn't support Port.");
      return false;
    }
    return true;
  }

  // Maybe underestimate if any GpuAttribute == 0
  public static ResourceDescriptor subtract(ResourceDescriptor lhs, ResourceDescriptor rhs) {
    ResourceDescriptor ret = new ResourceDescriptor();
    ret.setMemoryMB(lhs.getMemoryMB() - rhs.getMemoryMB());
    ret.setCpuNumber(lhs.getCpuNumber() - rhs.getCpuNumber());
    ret.setGpuAttribute(lhs.getGpuAttribute() & (~(rhs.getGpuAttribute())));
    if (lhs.getGpuAttribute() != 0 && rhs.getGpuAttribute() != 0) {
      ret.setGpuNumber(Long.bitCount(ret.getGpuAttribute()));
    } else {
      ret.setGpuNumber(lhs.getGpuNumber() - rhs.getGpuNumber());
    }
    ret.setPortRanges(ValueRangeUtils.subtractRange(lhs.getPortRanges(), rhs.getPortRanges()));
    ret.setPortNumber(ValueRangeUtils.getValueNumber(ret.getPortRanges()));
    return ret;
  }

  // Maybe overestimate if any GpuAttribute == 0
  public static ResourceDescriptor add(ResourceDescriptor lhs, ResourceDescriptor rhs) {
    ResourceDescriptor ret = new ResourceDescriptor();
    ret.setMemoryMB(lhs.getMemoryMB() + rhs.getMemoryMB());
    ret.setCpuNumber(lhs.getCpuNumber() + rhs.getCpuNumber());
    ret.setGpuAttribute(lhs.getGpuAttribute() | rhs.getGpuAttribute());
    if (lhs.getGpuAttribute() != 0 && rhs.getGpuAttribute() != 0) {
      ret.setGpuNumber(Long.bitCount(ret.getGpuAttribute()));
    } else {
      ret.setGpuNumber(lhs.getGpuNumber() + rhs.getGpuNumber());
    }
    ret.setPortRanges(ValueRangeUtils.addRange(lhs.getPortRanges(), rhs.getPortRanges()));
    ret.setPortNumber(ValueRangeUtils.getValueNumber(ret.getPortRanges()));
    return ret;
  }

  public static boolean fitsIn(ResourceDescriptor smaller, ResourceDescriptor bigger) {
    return smaller.getMemoryMB() <= bigger.getMemoryMB()
        && smaller.getCpuNumber() <= bigger.getCpuNumber()
        && smaller.getGpuNumber() <= bigger.getGpuNumber()
        && smaller.getGpuAttribute() == (smaller.getGpuAttribute() & bigger.getGpuAttribute())
        && ValueRangeUtils.fitInRange(smaller.getPortRanges(), bigger.getPortRanges());
  }

  @Override
  public String toString() {
    return String.format("[MemoryMB: [%s]", getMemoryMB()) + " " +
        String.format("CpuNumber: [%s]", getCpuNumber()) + " " +
        String.format("GpuNumber: [%s]", getGpuNumber()) + " " +
        String.format("GpuAttribute: [%s]", CommonExts.toStringWithBits(getGpuAttribute())) + " " +
        String.format("PortNumber: [%s]", getPortNumber()) + " " +
        String.format("PortRanges: [%s]]", CommonExts.toString(getPortRanges()));
  }
}
