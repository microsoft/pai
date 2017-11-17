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

package com.microsoft.frameworklauncher.applicationmaster;


import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.Assert;
import org.junit.Test;


public class TopologyAwareGPUSelectorTest {

  private static final Log LOG =
      LogFactory.getLog(TopologyAwareGPUSelectorTest.class);

  //Test cases for allocate -1, 0, 1, 2, 4 ,8,16 GPUs from an empty node, free GPU is 11111111 , 1 means free, 0 means busy.
  @Test
  public void testIdealSocreCalculatr() {
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    int score = selector.getIdeaCost(0);
    Assert.assertEquals(score, 0);
    score = selector.getIdeaCost(1);
    Assert.assertEquals(score, 0);
    score = selector.getIdeaCost(2);
    Assert.assertEquals(score, 1);
    score = selector.getIdeaCost(4);
    Assert.assertEquals(score, 4);
    score = selector.getIdeaCost(8);
    Assert.assertEquals(score, 12);
    score = selector.getIdeaCost(16);
    Assert.assertEquals(score, 32);
    score = selector.getIdeaCost(60);
    Assert.assertEquals(score, 184);
  }

  //Test cases for allocate -1, 0, 1, 2, 4 ,8 GPUs from an empty node, free GPU is 11111111 , 1 means free, 0 means busy.
  @Test
  public void testScenario11111111() {
    long currentStatus = 0xFF;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();

    boolean ret = selector.calculateBestGPUsCandidate(0, 8, currentStatus);
    Assert.assertEquals(true, ret);
    ret = selector.calculateBestGPUsCandidate(-1, 8, currentStatus);
    Assert.assertEquals(false, ret);
    ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1111", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11111111", Long.toBinaryString(selector.getCandidateGPUbitmap()));
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 7 free GPU, the GPU topology is:  11111110, 1 means free, 0 means busy.
  @Test
  public void testScenario11111110() {
    long currentStatus = 0xFE;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("10", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11110000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 7 free GPU, the GPU topology is:  11101111, 1 means free, 0 means busy.
  @Test
  public void testScenario11101111() {
    long currentStatus = 0xEF;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11000000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1111", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 6 free GPU, the GPU topology is:  01110111, 1 means free, 0 means busy.
  @Test
  public void testScenario01110111() {
    long currentStatus = 0x77;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("110011", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 6 free GPU, the GPU topology is:  01111101, 1 means free, 0 means busy.
  @Test
  public void testScenario01111101() {
    long currentStatus = 0x7D;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("111100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 2 free GPU, the GPU topology is:  01000100, 1 means free, 0 means busy.
  @Test
  public void testScenario01000100() {
    long currentStatus = 0x44;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1000100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(false, ret);
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 4 free GPU, the GPU topology is:  01100011, 1 means free, 0 means busy.
  @Test
  public void testScenario01100011() {
    long currentStatus = 0x63;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1100011", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 4 free GPU, the GPU topology is:  10110100, 1 means free, 0 means busy.
  @Test
  public void testScenario10110100() {
    long currentStatus = 0xB4;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("110000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("10110100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  //Test cases for allocate 1, 2, 4 ,8 GPUs from an GPU with 1 free GPU, the GPU topology is:  00000100, 1 means free, 0 means busy.
  @Test
  public void testScenario00000100() {
    long currentStatus = 0x04;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(1, 8, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("100", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(2, 8, currentStatus);
    Assert.assertEquals(false, ret);
    ret = selector.calculateBestGPUsCandidate(4, 8, currentStatus);
    Assert.assertEquals(false, ret);
    ret = selector.calculateBestGPUsCandidate(8, 8, currentStatus);
    Assert.assertEquals(false, ret);
  }

  @Test
  public void testScenarioGreaterthanEightAllocation() {
    Long currentStatus = 0xFF0FFFFFFFFFFFFFl;
    TopologyAwareGPUSelector selector = new TopologyAwareGPUSelector();
    boolean ret = selector.calculateBestGPUsCandidate(8, 64, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1111111100000000000000000000000000000000000000000000000000000000", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(16, 64, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("111111111111111100000000000000000000000000000000", Long.toBinaryString(selector.getCandidateGPUbitmap()));

    ret = selector.calculateBestGPUsCandidate(32, 64, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("11111111111111111111111111111111", Long.toBinaryString(selector.getCandidateGPUbitmap()));

    ret = selector.calculateBestGPUsCandidate(40, 64, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("1111111100000000000000000000000011111111111111111111111111111111", Long.toBinaryString(selector.getCandidateGPUbitmap()));
    ret = selector.calculateBestGPUsCandidate(48, 64, currentStatus);
    Assert.assertEquals(true, ret);
    Assert.assertEquals("111111111111111111111111111111111111111111111111", Long.toBinaryString(selector.getCandidateGPUbitmap()));

  }
}
