## Cleaner-Test-Job

- [How to Use](#HT_Use)
- [How to Configure](#HT_Config)
- [How to Build Job Image](#HT_Image)

#### How to use cleaner test job <a name="HT_Use"></a>

1. Go to PAI web portal, click Submit Job in left toolbar.
2. Import job json file. (cleaner-test-job.json)
3. Change variables in command text field if needed.
4. Click Submit button to submit job.
5. Go to Jobs page, keep monitoring the job you just submitted. 
6. If everything work as expected, the job will be killed by cleaner. Click "Go to Tracking Page", you will find info "Docker container killed by cleaner due to disk pressure".

#### How to configure variables in job <a name="HT_Config"></a>

In the job page, use the following command to run cleaner test:
sh /cleaner-test/cleaner-test.sh <threshold> <time>
 - threshold: Test job will fill the disk to (threshold + 1) percent. Please adjust this value according to cleaner threshold setting.
 - time: The time cost that job fill disk to (threshold + 1)%.

In Submit Jobs page, after import json file, you will find "sh /cleaner-test/cleaner-test.sh 94 180" by default.


#### How to build job docker image <a name="HT_Image"></a>

Run the following command under this folder, make sure you have docker installed.
docker build -f cleaner-test.dockerfile .
Then tag the docker image and upload to your docker repo. 
