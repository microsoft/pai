# About aii-fs
aii-fs is a standard tool to transfer files between user’s local file system and the HDFS of AII platform.
# Getting Started
Please make sure you have installed python and pip in you computer.
# Instructions for Developers
* Run "pip install -r requirements.txt", it will install dependence for the project.
* Run "python aii-fs.py -h" to get detailed usage.
* Run "python aii-fs.py --config host=10.0.3.9 port=50070 user=root" to store the config of hdfs, default port is 50070, default user is root, no default host.
* You can also run command with argument "--host", "--port", "--user". These arguments have higer priority than the stored config.
# Usage
```
example use:
  aii-fs --config host=10.0.3.9 port=50070 user=root         -- store hdfs config
  aii-fs -ls hdfs://                                         -- list the contents of a root HDFS directory 
  aii-fs -ls hdfs:// --host 10.0.3.9                         -- list the contents of a root HDFS directory with host specified
  aii-fs -ls hdfs:// --host 10.0.3.9 --port 50070 --user root    -- list the contents of a root HDFS directory with host, port and user specified
  aii-fs -ls -r hdfs://                                      -- list the contents of a root HDFS directory, recursively 
  aii-fs -mkdir hdfs://mydir/mysubdir/mysubdir2              -- makes mysubdir2 and all directories along the way 
  aii-fs -rm hdfs://mydir/mysubdir/myfile                    -- removes myfile from mysubdir 
  aii-fs -rm hdfs://mydir/mysubdir                           -- removes mysubdir and all files and directories in it 
  aii-fs -cp c:\mylocalfile hdfs://mydir/myremotedir         -- copy mylocalfile into myremotedir 
  aii-fs -cp -r c:\mylocaldir hdfs://mydir/myremotedir       -- copy mylocaldir into myremotedir, recursively 
  aii-fs -cp -r c:\mylocaldir\* hdfs://mydir/myremotedir     -- copy mylocaldir's contents into myremotedir, recursively 
  aii-fs -cp c:\mylocaldir\\a hdfs://mydir/myremotedir/b     -- copy file a from mylocaldir to myremotedir and rename to b 
  aii-fs -cp -r hdfs://mydir/myremotedir c:\mylocaldir       -- copy myremotedir into mylocaldir, recursively 
  aii-fs -cp -r hdfs://mydir/myremotedir/* c:\mylocaldir     -- copy myremotedir's contents into mylocaldir, recursively 
exit code:
  0   -- Success 
  1   -- An exception happened during the operation including bad connection 
  2   -- AII_VC environment variable not set to valid VC or insufficient/invalid command line argument(s) 
  3   -- Path not found 
  4   -- Unauthorized access 
  5   -- Path not empty 
  6   -- Check failed after operation 
  100 -- Failed to copy too many times 
  101 -- Failed to concat chunks into file 
```