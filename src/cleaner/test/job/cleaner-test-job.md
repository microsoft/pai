## Cleaner-Test-Job

- [How to Use](#HT_Use)
- [How to Configure](#HT_Config)
- [How to Build Job Image](#HT_Image)

#### How to use cleaner test job <a name="HT_Use"></a>

1. Go to PAI web portal, enter job submission page.
2. Import job yaml file. (cleaner-test-job.yaml)
3. Change parameters if needed.
4. Click Submit button to submit job.
5. Go to Jobs page, keep monitoring the job you just submitted. 
6. If everything work as expected, the job will fail due to killed by cleaner. Click "Go to Tracking Page", you will find info "Docker container killed by cleaner due to disk pressure" in the end.

#### How to configure variables in job <a name="HT_Config"></a>

In the job page, use the following command to run cleaner test:
```sh
sh /cleaner-test/cleaner-test.sh <% $parameters.threshold %> <% $parameters.time %>
```
Set parameters:
 - threshold: Test job will fill the disk to (threshold + 1)%. Please adjust this value according to cleaner threshold settings. Default value is 94.
 - time: The time cost that job fill disk to (threshold + 1)%. Default value is 30.

#### How to build job docker image <a name="HT_Image"></a>

Run the following command under this folder, make sure you have docker installed.
```sh
docker build -f cleaner-test.df -t <your image tag> .
```
Then tag the docker image and upload to your docker repo. We offer the default docker image on openpai/testcleaner
