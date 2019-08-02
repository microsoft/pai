"""
[summary]
"""
from openpaisdk.io_utils import mkdir_for


class Storage:

    def __init__(self, protocol: str='webHDFS', *args, **kwargs):
        self.protocol, self.client = protocol.lower(), None
        if protocol.lower() == 'webHDFS'.lower():
            from hdfs import InsecureClient
            self.client = InsecureClient(*args, **kwargs)
            for f in 'upload download list status delete'.split():
                setattr(self, f, getattr(self, '%s_%s' % (f, protocol.lower())))

    def upload_webhdfs(self, local_path: str, remote_path: str, **kwargs):
        print("upload %s -> %s" % (local_path, remote_path))
        return self.client.upload(local_path=local_path, hdfs_path=remote_path, **kwargs)

    def download_webhdfs(self, remote_path: str, local_path: str, **kwargs):
        mkdir_for(local_path)
        print("download %s -> %s" % (remote_path, local_path))
        return self.client.download(local_path=local_path, hdfs_path=remote_path, overwrite=True, **kwargs)

    def list_webhdfs(self, remote_path: str, **kwargs):
        return self.client.list(hdfs_path=remote_path, **kwargs)

    def status_webhdfs(self, remote_path: str, **kwargs):
        return self.client.status(hdfs_path=remote_path, **kwargs)

    def delete_webhdfs(self, remote_path: str, **kwargs):
        return self.client.delete(hdfs_path=remote_path, **kwargs)