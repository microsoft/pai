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
6. If everything work as expected, the job will fail due to killed by cleaner. Click "Go to Tracking Page", you will find info "Docker container killed by cleaner due to disk pressure" in the end.

#### How to configure variables in job <a name="HT_Config"></a>

In the job page, use the following command to run cleaner test:

```sh
sh /cleaner-test/cleaner-test.sh <threshold> <time>
```

Variables:

- threshold: Test job will fill the disk to (threshold + 1)%. Please adjust this value according to cleaner threshold settings.
- time: The time cost that job fill disk to (threshold + 1)%.

By default, the run command should be:

```sh
sh /cleaner-test/cleaner-test.sh 94 180
```

#### How to build job docker image <a name="HT_Image"></a>

Run the following command under this folder, make sure you have docker installed.

```sh
docker build -f cleaner-test.df -t <your image tag> .
```

Then tag the docker image and upload to your docker repo. We offer the default docker image on openpai/testcleaner