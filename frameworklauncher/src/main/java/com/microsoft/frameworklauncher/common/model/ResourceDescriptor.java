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

import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.validation.MapKeyNamingValidation;
import org.apache.hadoop.yarn.api.records.Resource;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
  private List<ValueRange> portRanges = new ArrayList<>();

  @Valid
  @NotNull
  private Integer portNumber = 0;

  @Valid
  @NotNull
  @MapKeyNamingValidation
  private Map<String, Ports> portDefinitions = new HashMap<>();

  @Valid
  @NotNull
  private DiskType diskType = DiskType.HDD;

  @Valid
  @NotNull
  private Integer diskMB = 0;

  @Valid
  @NotNull
  private Integer gpuNumber = 0;

  @Valid
  @NotNull
  private Long gpuAttribute = 0L;

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

  public Map<String, Ports> getPortDefinitions() {
    return portDefinitions;
  }

  public void setPortDefinitions(Map<String, Ports> portDefinitions) {
    this.portDefinitions = portDefinitions;
    if (portDefinitions == null) {
      return;
    }

    // Convert port information from user input format to List<Range> format for AM scheduling.
    List<ValueRange> portRanges = new ArrayList<ValueRange>();
    int portNumber = 0;
    for (Ports ports : portDefinitions.values()) {
      if (ports.getStart() != 0) {
        portRanges.add(ValueRange.newInstance(ports.getStart(), ports.getStart() + ports.getCount() - 1));
      } else {
        portNumber += ports.getCount();
      }
    }

    // portNumber and portRangeList are not allow coexistence.
    // user is not allowed to set "Any" port and "Specified" port in the same task role.
    if (portNumber == 0 && ValueRangeUtils.getValueNumber(portRanges) > 0) {
      this.setPortRanges(portRanges);
      this.setPortNumber(0);
    } else if (portNumber > 0 && ValueRangeUtils.getValueNumber(portRanges) == 0) {
      this.setPortNumber(portNumber);
    }
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
    return ResourceDescriptor.newInstance(memoryMB, cpuNumber, gpuNumber, gpuAttribute, 0, new ArrayList<ValueRange>());
  }

  public static ResourceDescriptor newInstance(Integer memoryMB, Integer cpuNumber, Integer gpuNumber,
      Long gpuAttribute, int portNumber, List<ValueRange> portRanges) {
    ResourceDescriptor resource = new ResourceDescriptor();
    resource.setMemoryMB(memoryMB);
    resource.setCpuNumber(cpuNumber);
    resource.setGpuNumber(gpuNumber);
    resource.setGpuAttribute(gpuAttribute);
    resource.setPortNumber(portNumber);
    resource.setPortRanges(portRanges);
    return resource;
  }

  public static ResourceDescriptor fromResource(Resource res) throws Exception {
    ResourceDescriptor rd = new ResourceDescriptor();
    rd.setMemoryMB(res.getMemory());
    rd.setCpuNumber(res.getVirtualCores());
    rd.setGpuAttribute(0L);
    rd.setGpuNumber(0);
    Class<?> clazz = res.getClass();

    try {

      Method getGpuNumber = clazz.getMethod("getGPUs");
      Method getGpuAttribute = clazz.getMethod("getGPUAttribute");

      rd.setGpuNumber((int) getGpuNumber.invoke(res));
      rd.setGpuAttribute((long) getGpuAttribute.invoke(res));
    } catch (NoSuchMethodException e) {
      LOGGER.logDebug(e, "Ignore: Failed get GPU information, YARN library doesn't support gpu as resources");
    } catch (IllegalAccessException e) {
      LOGGER.logError(e, "Ignore: Failed to get GPU information, illegal access function");
    }

    try {

      Class hadoopValueRangesClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRanges");
      Class hadoopValueRangeClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRange");
      Method getPorts = clazz.getMethod("getPorts");

      Object hadoopValueRanges = getPorts.invoke(res);
      if (hadoopValueRanges != null) {
        Method getBegin = hadoopValueRangeClass.getMethod("getBegin");
        Method getEnd = hadoopValueRangeClass.getMethod("getEnd");

        Method getSortedRangesList = hadoopValueRangesClass.getMethod("getSortedRangesList");
        List<Object> hadoopValueRangeList = (List<Object>) getSortedRangesList.invoke(hadoopValueRanges);

        List<ValueRange> rangeList = new ArrayList<ValueRange>();
        for (Object hadoopRange : hadoopValueRangeList) {
          ValueRange range = new ValueRange();
          range.setBegin((int) getBegin.invoke(hadoopRange));
          range.setEnd((int) getEnd.invoke(hadoopRange));
          rangeList.add(range);
        }
        rd.setPortRanges(rangeList);
      }
    } catch (NoSuchMethodException e) {
      LOGGER.logDebug(e, "Ignore: Failed to get Ports information, YARN library doesn't support port");
    } catch (IllegalAccessException e) {
      LOGGER.logError(e, "Ignore: Failed to get Ports information, illegal access function");
    } catch (ClassNotFoundException e) {
      LOGGER.logDebug(e, "Ignore: Failed to get the class name");
    }
    LOGGER.logDebug("Get ResourceDescriptor: " + rd + " from hadoop resource: " + res);
    return rd;
  }

  public Resource toResource() throws Exception {
    Resource res = Resource.newInstance(memoryMB, cpuNumber);
    Class<?> clazz = res.getClass();

    if (gpuNumber > 0) {
      try {
        Method setGpuNumber = clazz.getMethod("setGPUs", int.class);
        Method setGpuAttribute = clazz.getMethod("setGPUAttribute", long.class);

        setGpuNumber.invoke(res, gpuNumber);
        setGpuAttribute.invoke(res, gpuAttribute);

      } catch (NoSuchMethodException e) {
        LOGGER.logWarning(e, "Ignore: Failed to set GPU information, YARN library doesn't support");
      } catch (IllegalAccessException e) {
        LOGGER.logError(e, "Ignore: Failed to set GPU information, illegal access function");
      }
    }

    if (portRanges != null && portRanges.size() > 0) {
      try {

        Class hadoopValueRangesClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRanges");
        Class hadoopValueRangeClass = Class.forName("org.apache.hadoop.yarn.api.records.ValueRange");

        Object obj = hadoopValueRangesClass.getMethod("newInstance").invoke(null);

        List<Object> hadoopValueRangeList = new ArrayList<Object>();

        for (ValueRange range : portRanges) {
          Object valueRangeObj = hadoopValueRangeClass.getMethod("newInstance", int.class, int.class).invoke(null, range.getBegin(), range.getEnd());
          hadoopValueRangeList.add(valueRangeObj);
        }

        Method setRangesList = hadoopValueRangesClass.getMethod("setRangesList", List.class);
        setRangesList.invoke(obj, hadoopValueRangeList);

        Method setPorts = clazz.getMethod("setPorts", hadoopValueRangesClass);
        setPorts.invoke(res, obj);

      } catch (NoSuchMethodException e) {
        LOGGER.logDebug(e, "Ignore: Failed to get Ports information, YARN library doesn't support Port");
      } catch (IllegalAccessException e) {
        LOGGER.logError(e, "Ignore: Failed to get Ports information, illegal access function");
      } catch (ClassNotFoundException e) {
        LOGGER.logDebug(e, "Ignore: Failed to get the class Name");
      }
    }
    LOGGER.logDebug("Put LocalResource " + this.toString() + " to hadoop resource: " + res);
    return res;
  }

  @Override
  public String toString() {
    return String.format("[MemoryMB: [%s]", getMemoryMB()) + " " +
        String.format("CpuNumber: [%s]", getCpuNumber()) + " " +
        String.format("GpuNumber: [%s]", getGpuNumber()) + " " +
        String.format("GpuAttribute: [%s]", CommonExts.toStringWithBits(getGpuAttribute())) + " " +
        String.format("PortNumber: [%s]", getPortNumber()) + " " +
        String.format("PortRanges: [%s]]", ValueRangeUtils.toString(portRanges));
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
}
