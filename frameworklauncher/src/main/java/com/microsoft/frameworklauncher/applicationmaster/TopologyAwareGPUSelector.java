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

/**
 * Based on the user input (request GPU  number string) and the resource node information to pick a minimum cross gpu communication cost solution.
 * The goal of the class -is to selection M gpus from N free GPU, and let the selected gpus as "near" as possible.
 */

public class TopologyAwareGPUSelector {
  public static int MAX_GPU_PER_NODE = 64;
  // The default gpu topology score[distance], we assume that a 8 GPU machine organized as bellow chart. gpu0 and gpu1, gpu2 and gpu3, gpu4 and gpu5,
  // gpu6 and gpu7 has distance 1 ...
  // this default topology can can support 32 gpu node at most. today(2017), the max GPU number in a machine is 8.
  //            _______________
  //           /     4         \
  //      ____/__            ___\___
  //     /   2   \          /   2   \
  //   / 1\     / 1\      / 1\    / 1\
  // [0]  [1] [2]  [3]   [4] [5] [6] [7]
  //
  private int[] gpuTopologyCost = {1, 2, 1, 4, 1, 2, 1, 8, 1, 2, 1, 4, 1, 2, 1, 16, 1, 2, 1, 4, 1, 2, 1, 8, 1, 2, 1, 4, 1, 2, 1, 32,
      1, 2, 1, 4, 1, 2, 1, 8, 1, 2, 1, 4, 1, 2, 1, 16, 1, 2, 1, 4, 1, 2, 1, 8, 1, 2, 1, 4, 1, 2, 1};
  // the test solution score for current selection.
  private int bestCandidateCost = 0;
  // the GPU arrangement when the score is the best socre.
  private long bestGPUArrangement = 0;
  // If we choose solution bestGPUArrangement, the node gpu will goes into a new status, the indicate the score of this new status.
  private int newStatusBestCost = 0;
  private int usedNumGPU = 0;
  private int freeNumGPU = 0;
  private int[] availableGPU = new int[MAX_GPU_PER_NODE];
  private int[] usedGPU = new int[MAX_GPU_PER_NODE];
  private int[] newUsedGPU = new int[MAX_GPU_PER_NODE];

  public long getCandidateGPUbitmap() {
    return bestGPUArrangement;
  }

  public int getCandidateCost() {
    return bestCandidateCost;
  }

  // The ideal score is: 1 for two  gpu: gpu0+gpu1, 4 for four GPUs request: gpu0 +gpu1+gpu2+gpu3
  public int getIdeaCost(int requestGPU) {
    if (requestGPU <= 1) {
      return 0;
    }
    int minCost = Integer.MAX_VALUE;
    for (int i = 0; i < MAX_GPU_PER_NODE - requestGPU - 1; i++) {
      int sum = 0;
      for (int j = 0; j < requestGPU - 1; j++) {
        sum += gpuTopologyCost[i + j];
      }
      if (sum < minCost) {
        minCost = sum;
      }
    }
    return minCost;
  }

  // Try to allocated gpuRequest from node with  GPU status: currentGPUStatus
  public boolean calculateBestGPUsCandidate(int gpuRequest, int gpuTotal, long currentGPUStatus) {
    reset();
    if (gpuRequest < 0 || gpuTotal < 0 || gpuRequest > gpuTotal) {
      return false;
    }
    // If don't need GPU, we set this allocation as "success"
    if (gpuRequest == 0) {
      return true;
    }

    if (gpuRequest > MAX_GPU_PER_NODE || gpuTotal > MAX_GPU_PER_NODE) {
      // Currently not support more than 32 GPU in a container
      return false;
    }

    long tempGPUStatus = 1;
    int position = 0;

    // Before allocation, try to convert the GPU information from Binary format to a int array format.
    while (position < gpuTotal) {
      // The bit value equal 1 means the GPU is available
      if ((currentGPUStatus & tempGPUStatus) == tempGPUStatus) {
        availableGPU[freeNumGPU++] = position;
      } else {
        usedGPU[usedNumGPU++] = position;
      }
      tempGPUStatus <<= 1;
      position++;
    }
    // Available number smaller than request number, this allocation will fail
    if (freeNumGPU < gpuRequest) {
      return false;
    }
    enumerateGpuCombination(gpuRequest, gpuTotal);

    // Return true if find a allocation solution
    if (bestGPUArrangement != 0)
      return true;
    else
      return false;
  }

  private void reset() {
    bestCandidateCost = Integer.MAX_VALUE;
    bestGPUArrangement = 0;
    newStatusBestCost = Integer.MAX_VALUE;
    usedNumGPU = 0;
    freeNumGPU = 0;
    for (int i = 0; i < MAX_GPU_PER_NODE; i++) {
      availableGPU[i] = 0;
      usedGPU[i] = 0;
      newUsedGPU[i] = 0;
    }
  }

  private int calculateSelectCost(int requestGPU, int[] choosed) {
    if (requestGPU == 1) {
      return 0;
    }
    int lastPosition = 0;
    int score = 0;
    for (int i = 1; i < requestGPU; i++) {
      score += getTopologyCost(choosed[lastPosition], choosed[i]);
      lastPosition = i;
    }
    return score;
  }

  // Calculate two GPUs communication cost score.
  private int getTopologyCost(int start, int end) {
    int max = 0;
    for (int i = start; i < end; i++) {
      if (gpuTopologyCost[i] > max) {
        max = gpuTopologyCost[i];
      }
    }
    return max;
  }

  private void enumerateGpuCombinationRecursion(int requestGPU, int totalGPU, int[] choosed, int assigned, int lastSelected) {

    int cost = calculateSelectCost(assigned, choosed);
    if (cost > bestCandidateCost) {
      return;
    }
    if (assigned == requestGPU) {
      int m = 0, n = 0;
      for (int i = 0; i < requestGPU + usedNumGPU; i++) {
        if (m < usedNumGPU && n < requestGPU) {
          if (usedGPU[m] < choosed[n]) {
            newUsedGPU[i] = usedGPU[m++];
          } else if (n < requestGPU) {
            newUsedGPU[i] = choosed[n++];
          }
        } else if (n < requestGPU) {
          newUsedGPU[i] = choosed[n++];
        } else if (m < usedNumGPU) {
          newUsedGPU[i] = usedGPU[m++];
        }
      }

      int newCost = calculateSelectCost(requestGPU + usedNumGPU, newUsedGPU);
      if (bestCandidateCost == cost && newCost >= newStatusBestCost) {
        return;
      }
      bestCandidateCost = cost;
      newStatusBestCost = newCost;

      bestGPUArrangement = 0;
      long choos = 1;
      for (int i = 0; i < requestGPU; i++) {
        bestGPUArrangement |= (choos << choosed[i]);
      }
      return;
    }
    for (int i = lastSelected; i < freeNumGPU; i++) {
      int leftRequest = requestGPU - assigned;
      if (leftRequest <= freeNumGPU - i) {
        // Optimization: if the request GPU number >= 8, Put 4 GPUs together.
        // Otherwise, enumerate one by one for >=8 gpus request in a 64 GPU node is performance disaster.
        int step = 1;
        if (requestGPU >= 8 && leftRequest >= 4) {
          step = 4;
          choosed[assigned] = availableGPU[i];
          choosed[assigned + 1] = availableGPU[i + 1];
          choosed[assigned + 2] = availableGPU[i + 2];
          choosed[assigned + 3] = availableGPU[i + 3];
        } else {
          step = 1;
          choosed[assigned] = availableGPU[i];
        }
        enumerateGpuCombinationRecursion(requestGPU, totalGPU, choosed, assigned + step, i + step);
      }
    }
  }

  // Implement of Select M gpu from N free GPU node.
  // Recursion enumerate all the possible solution of candidate GPU,
  // and calculate their communication score.
  // Save the best one to local member
  private void enumerateGpuCombination(int requestGPU, int totalGPU) {
    int[] choosed = new int[requestGPU];
    enumerateGpuCombinationRecursion(requestGPU, totalGPU, choosed, 0, 0);
    return;
  }
}
