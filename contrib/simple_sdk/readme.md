###Introduction
This is a simple python sdk for rest server of PAI. 
You can start, stop a job and get the state of the given job. 
The method I recommend to use the sdk is use another thread to start, get state and stop your job. 
###settings 
Please set your settings before you use it. Include your PAI username, password and reset server socket. 
###job management 
For input and output of every method, please read the commenting in job_namage.py. 
###In addition 
Due to relying on hdfs, many jobs usually need to upload their code and data to hdfs first. So, a hdfs client based on hdfscli is reserved in the initiate method in job_manage.py. You can build your own upload and download methods according to it. 
