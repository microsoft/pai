<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# Troubleshoot job failure

## How to debug a job

1. From OpenPAI web page to debug job

    Please refer doc [How to diagnose job problems through logs](../job_log.md)

1. SSH to job container and debug job

    You can ssh connect to a specified container either from outside or inside container.

    - SSH connect from outside

      1. Get job ssh connect info by invoking [Get job SSH info](../rest-server/API.md#get-userusernamejobsjobnamessh) api or clicking the job detail page on webportal.

      2. Open a Bash shell terminal.

      3. Download the corresponding private key from HDFS.
         For example, with [wget](http://www.gnu.org/software/wget/), you can execute below command line:

         ```sh
         wget http://host:port/webhdfs/v1/Container/userName/jobName/ssh/keyFiles/userName~jobName?op=OPEN -O userName~jobName
         ```

      4. Use `chmod` command to set correct permission for the key file.

         ```sh
         chmod 400 userName~jobName
         ```

      5. Use `ssh` command to connect into container. for example

         ```sh
         ssh -i userName~jobName -p ssh_port root@container_ip
         ```

    - SSH connect inside containers

      You can use `ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX` command to connect into another containers which belong to the same job. For example, if there are two taskRoles: master and worker, you can connect to worker-0 container directly with below command line:

      ```sh
      ssh worker-0
      ```

1. Job Profiling

      Users can view the resource cost and bottlenecks of various metrics of the job by following the [job profiling doc](../job_profiling.md).
