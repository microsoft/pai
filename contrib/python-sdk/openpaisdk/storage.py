"""
[summary]
"""


class Storage:

    def __init__(self, protocol: str='hdfs', *args, **kwargs):
        self.protocol, self.client = protocol.lower(), None
        if protocol == 'hdfs':
            from hdfs import InsecureClient
            self.client = InsecureClient(*args, **kwargs)

    def upload(self, local_path: str, remote_path: str, **kwargs):
        if self.protocol == 'hdfs':
            return self.client.upload(local_path=local_path, hdfs_path=remote_path, **kwargs)
        raise NotImplementedError    

    def download(self, remote_path: str, local_path: str, **kwargs):
        if self.protocol == 'hdfs':
            return self.client.download(local_path=local_path, hdfs_path=remote_path, **kwargs)
        raise NotImplementedError

    def list(self, remote_path: str, **kwargs):
        if self.protocol == 'hdfs':
            return self.client.list(hdfs_path=remote_path, **kwargs)
        raise NotImplementedError

    def status(self, remote_path: str, **kwargs):
        if self.protocol == 'hdfs':
            return self.client.status(hdfs_path=remote_path, **kwargs)
        raise NotImplementedError  