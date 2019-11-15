# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import argparse
import os
import sys
from openpaisdk.cli_arguments import register_as_cli, CliRegistery
from openpaisdk.defaults import get_defaults, update_default
from openpaisdk.io_utils import browser_open, to_screen
from openpaisdk.utils import Nested, run_command, na, randstr
from openpaisdk.defaults import __flags__
from openpaisdk.cluster import ClusterList, Cluster
from openpaisdk.job import Job
from openpaisdk.storage import pai_open_fs


def extract_args(args: argparse.Namespace, get_list: list = None, ignore_list: list = ["scene", "action", "cmd"]):
    if get_list:
        return {k: getattr(args, k) for k in get_list}
    return {k: v for k, v in vars(args).items() if k not in ignore_list}


@register_as_cli(
    'set',
    ['--is-global', 'contents'],
    'set as default'
)
def cli_set(args):
    import re
    if not args.contents:
        return get_defaults(False, True, False) if args.is_global else get_defaults(True, True, False)
    kv_pairs = []
    for content in args.contents:
        m = re.match("^([^=]+?)([\+|\-]*=)([^=]*)$", content)
        if m:
            kv_pairs.append(m.groups())
        else:
            kv_pairs.append((content, '', ''))
    for kv_pair in kv_pairs:
        assert kv_pair[0] and kv_pair[1] in ["=", "+=", "-="] and kv_pair[2], \
            f"must specify a key=value pair ({kv_pair[0]}, {kv_pair[2]})"
        update_default(kv_pair[0], kv_pair[2], is_global=args.is_global)


@register_as_cli(
    'unset',
    ['--is-global', 'contents'],
    'unset a default'
)
def cli_unset(args):
    for kv_pair in args.contents:
        update_default(kv_pair[0], kv_pair[2], is_global=args.is_global, to_delete=True)


@register_as_cli(
    'add-cluster',
    ['--cluster-alias', '--pai-uri', '--user', '--password', '--authen-token', '--storage-name'],
    'add a cluster to the clusters.yaml',
)
def cli_add_cluster(args):
    assert args.cluster_alias or args.pai_uri or args.user, "must specify cluster-alias, pai-uri, user"
    assert args.password or args.token, "please add an authentication credential, password or token"
    ClusterList().load().add(extract_args(args)).save()


@register_as_cli(
    'add-storage-cluster',
    ['--cluster-alias', '--type', '--address', '--path', 'contents'],
    "add a storage cluster"
)
def cli_add_storage_cluster(args):
    assert args.cluster_alias, "must specify the cluster-alias"
    assert args.type and args.address, "must specify address and type of server"
    cfg_prefixes = ["configs", "servers_data", "servers_ext"]
    storage_cfg = {k: {} for k in cfg_prefixes}
    for word in args.contents:
        key, value = word.split("=")
        prefix, rkey = key.split(":")
        storage_cfg[prefix].update({rkey: value})
    cfg = {
        "cluster_alias": args.cluster_alias,
        "type": f"storage-{args.type}",
        "virtual_clusters": ['default'],
        "storages": Cluster.storage_entries(*Cluster.fake_storage_info(
            args.type, args.address, na(args.path, "/"), **storage_cfg
        ))
    }
    ClusterList().load().add(cfg).save()


@register_as_cli(
    'edit-clusters',
    ['--editor'],
    'edit the clusters.yaml',
)
def cli_edit_cluster(args):
    assert args.editor, "cannot edit the file without an editor"
    run_command([args.editor, cluster_cfg_file])


def tabulate_resources(dic: dict):
    to_screen([
        [c, i.get("uri", None), i.get("user", None), v, i["GPUs"], i["vCores"], i["memory"]] for c in dic.keys() for v, i in dic[c].items()
    ], _type="table", headers=["cluster", "uri", "user", "virtual-cluster", "GPUs", "vCores", "memory"])
    return dic


@register_as_cli(
    'list-clusters',
    [],
    'list clusters in clusters.yaml',
)
def cli_list_clusters(args):
    info = ClusterList().load().tell()
    tabulate_resources(info)


@register_as_cli(
    'delete-cluster',
    ['cluster_alias'],
    'delete a cluster'
)
def cli_delete_cluster(args):
    clusters = ClusterList().load()
    if clusters.delete(args.cluster_alias):
        to_screen("cluster %s deleted" % args.cluster_alias)
        clusters.save()


@register_as_cli(
    'update-clusters',
    [],
    'update all registered clusters'
)
def cli_update_clusters(args):
    clusters = ClusterList().load()
    clusters.update_all()
    clusters.save()


@register_as_cli(
    'cluster-resources',
    [],
    'list available resources of all registered cluster'
)
def cli_cluster_resources(args):
    r = ClusterList().load().available_resources()
    tabulate_resources(r)


@register_as_cli(
    'select-cluster',
    ['--is-global', 'cluster_alias'],
    'select a cluster as default'
)
def cli_select_cluster(args):
    assert args.cluster_alias, "must specify a valid cluster-alias"
    update_default('cluster-alias', args.cluster_alias, is_global=args.is_global)


@register_as_cli(
    'update-token',
    ['--cluster-alias', '--authen-token'],
    'update the authentication token to avoid expiration'
)
def cli_update_token(args):
    assert args.cluster_alias and args.token, "must specify cluster-alias and authen-token"
    ClusterList().load().update(args.cluster_alias, token=args.token).save()


@register_as_cli(
    'select-storage',
    ['--cluster-alias', '--storage-name'],
    'select a storage mount point for system use'
)
def cli_select_storage(args):
    assert args.cluster_alias and args.storage_name, "must specify cluster-alias and storage-name"
    ClusterList().load().update(args.cluster_alias, storage_name=args.storage_name).save()


@register_as_cli(
    'list-storages',
    ['cluster_alias'],
    "list the storages of a cluster"
)
def cli_list_storages(args):
    headers = ['name', 'mountPoint', 'type', 'server', 'path', 'permission', 'default']
    clusters = ClusterList().load()
    names = [s['name'] for s in clusters.select(args.cluster_alias)['storages']]
    storages = [clusters.select_storage(args.cluster_alias, name)[0] for name in names]
    to_screen([[s[h] for h in headers] for s in storages], 'table', headers=headers)


@register_as_cli(
    'list-jobs',
    ['--cluster-alias', '--user'],
    'get the job list from a cluster (with username)'
)
def cli_list_jobs(args):
    client = ClusterList().load().get_client(args.cluster_alias)
    if not args.user:
        args.user = client.user
        to_screen(
            "if not set, only your job will be listed, user `--user __all__` to list jobs of all users")
    if args.user == '__all__':
        args.user = None
    jobs = client.rest_api_job_list(user=args.user)
    return ["%s [%s]" % (j["name"], j.get("state", "UNKNOWN")) for j in jobs]


@register_as_cli(
    'job-status',
    ['--cluster-alias', '--user', 'job_name', 'query'],
    'get job status'
)
def cli_job_status(args):
    assert args.job_name, "must specify a job name"
    client = ClusterList().load().get_client(args.cluster_alias)
    if not args.user:
        args.user = client.user
    return client.rest_api_job_info(args.job_name, args.query, user=args.user)


@register_as_cli(
    ['stop-job', 'stop-jobs'],
    ['--cluster-alias', 'job_names'],
    'stop job(s)'
)
def cli_stop_job(args):
    assert args.job_names, "must specify a job name"
    client = ClusterList().load().get_client(args.cluster_alias)
    for job_name in args.job_names:
        to_screen(client.rest_api_execute_job(job_name, "STOP"))


def submit_it(job, args):
    if args.preview:
        return job.validate().get_config()
    result = job.submit(args.cluster_alias, args.virtual_cluster)
    if "job_link" in result and not getattr(args, 'no_browser', False):
        browser_open(result["job_link"])
    return result


@register_as_cli(
    'submit',
    ['--cluster-alias', '--virtual-cluster', '--preview', '--update', 'config'],
    'submit a config file'
)
def cli_submit(args):
    assert args.config, "please specify a job config file (json or yaml format)"
    assert os.path.isfile(args.config), "%s cannot be read" % args.config
    job = Job().load(fname=args.config)
    if args.update:
        for s in args.update:
            key, value = s.split("=")
            Nested(job.protocol).set(key, value)
    return submit_it(job, args)


common_job_args = [
    '--job-name',
    '--cluster-alias', '--virtual-cluster', '--workspace',  # for cluster
    '--sources', '--pip-installs',  # for sdk_template
    '--image', '--cpu', '--gpu', '--mem', "--memoryMB",
    '--preview', '--no-browser',
    '--python',
]


def check_common_job_args(args):
    assert args.cluster_alias, "must specify a cluster"
    args.sources = [] if not args.sources else args.sources
    args.pip_installs = [] if not args.pip_installs else args.pip_installs
    if args.sources:
        assert args.workspace, "must specify --workspace if --sources used"
        for s in args.sources:
            assert os.path.isfile(s), "file %s not found" % s
    assert args.image, "must specify a docker image"
    if args.job_name:
        args.job_name = args.job_name.replace("$", randstr(10))


@register_as_cli(
    'sub',
    common_job_args + ['commands'],
    'submit a job from an executable command'
)
def cli_sub(args):
    check_common_job_args(args)
    job = Job()
    job.new(args.job_name).one_liner(
        commands=" ".join(args.commands),
        image=args.image,
        resources=extract_args(args, ["gpu", "cpu", "memoryMB", "mem"]),
        cluster=extract_args(
            args, ["cluster_alias", "virtual_cluster", "workspace"]),
        sources=args.sources, pip_installs=args.pip_installs,
    )
    job.protocol["parameters"]["python_path"] = args.python
    return submit_it(job, args)


def connect_notebook(job):
    result = job.wait()
    if result is not None and result.get("notebook", None) is not None:
        browser_open(result["notebook"])
    return result


@register_as_cli(
    'start-container',
    common_job_args + ['--timeout', '--user'],
    'start an empty container visited through ssh'
)
def cli_start_container(args):
    check_common_job_args(args)
    assert args.timeout, "must specify a time period through '--timeout'"
    assert args.job_name, "must specify a job name"
    #assert args.user, "must specify a user"
    job = Job()
    # start an empty container
    job.new(args.job_name).one_liner(
        commands=" ".join([f'sleep {args.timeout}']),
        image=args.image,
        resources=extract_args(args, ["gpu", "cpu", "memoryMB", "mem"]),
        cluster=extract_args(
            args, ["cluster_alias", "virtual_cluster", "workspace"]),
    )
    result = submit_it(job, args)
    result.update(na(connect_notebook(job), {}))
    
    # ssh connection
    client = ClusterList().load().get_client(args.cluster_alias)
    if not args.user:
        args.user = client.user
    ssh_info = client.rest_api_job_info(args.job_name, 'ssh', user = args.user)
    ssh_private_key_link = ssh_info.get('keyPair', {}).get('privateKeyDirectDownloadLink', '')
    ssh_port = ssh_info.get('containers', {})[0].get('sshPort', '')
    ssh_ip = ssh_info.get('containers', [])[0].get('sshIp', '')
    ssh_user = ssh_info.get('keyPair', {}).get('privateKeyFileName', '')
    from openpaisdk.io_utils import web_download_to_folder
    web_download_to_folder(ssh_private_key_link, ".")
    to_screen(f'Download private key from {ssh_private_key_link}')
    to_screen(f'execute "ssh -i {ssh_user} -p {ssh_port} root@{ssh_ip}" to connect container')
    os.system(f'ssh -i {ssh_user} -p {ssh_port} root@{ssh_ip}')


@register_as_cli(
    'notebook-job',
    common_job_args + ['--interactive', '--notebook-token', 'notebook'],
    'submit a job from a local notebook'
)
def cli_submit_notebook(args):
    check_common_job_args(args)
    assert args.notebook or args.interactive, "must specify a notebook name unless in interactive mode"
    if not args.job_name:
        assert args.notebook or args.interactive, "must specify a notebook if no job name defined"
        args.job_name = os.path.splitext(os.path.basename(args.notebook))[
            0] + "_" + randstr().hex if args.notebook else "jupyter_server_{}".format(randstr().hex)
    if args.interactive and not args.token:
        to_screen("no authentication token is set", _type="warn")
    job = Job()
    job.new(args.job_name).from_notebook(
        nb_file=args.notebook, mode="interactive" if args.interactive else "silent", token=args.token,
        image=args.image,
        cluster=extract_args(
            args, ["cluster_alias", "virtual_cluster", "workspace"]),
        resources=extract_args(args, ["gpu", "cpu", "memoryMB", "mem"]),
        sources=args.sources, pip_installs=args.pip_installs,
    )
    job.protocol["parameters"]["python_path"] = args.python
    result = submit_it(job, args)
    if not args.preview:
        result.update(na(connect_notebook(job), {}))
    return result


@register_as_cli(
    'connect-job',
    ['--cluster-alias', 'job_name'],
    'connect to a running job'
)
def cli_connect_job(args):
    assert args.cluster_alias, "must specify a cluster"
    assert args.job_name, "must specify a job name"
    to_screen("retrieving job config from cluster")
    job = Job()
    job.load(job_name=args.job_name,
             cluster_alias=args.cluster_alias)
    return connect_notebook(job)


@register_as_cli(
    ['list-dir', 'listdir'],
    ['path_1'],
    'list the content of dir'
)
def cli_listdir(args):
    f, pth = pai_open_fs(args.path_1)
    return f.listdir(pth)


@register_as_cli(
    ['getinfo'],
    ['path_1'],
    'get the info of a file or folder location'
)
def cli_getinfo(args):
    f, pth = pai_open_fs(args.path_1)
    return f.getinfo(pth)


@register_as_cli(
    ['makedir', 'makedirs'],
    ['path_1'],
    'make the directory (recurisively if necessary)'
)
def cli_makedir(args):
    f, pth = pai_open_fs(args.path_1)
    f.makedirs(pth)


@register_as_cli(
    ['remove', 'delete'],
    ['path_1'],
    "remove the file or directory"
)
def cli_remove(args):
    f1, pth1 = pai_open_fs(args.path_1)
    assert f1.exists(pth1), f"path {f1.expand_root(pth1)} does not exist"
    if f1.isdir(pth1):
        f1.removedir(pth1)
    else:
        f1.remove(pth1)


@register_as_cli(
    'copy',
    ['path_1', 'path_2'],
    'copy from path_1 to path_2'
)
def cli_copy(args):
    from fs.copy import copy_dir, copy_file
    f1, pth1 = pai_open_fs(args.path_1)
    f2, pth2 = pai_open_fs(args.path_2)
    assert f1.exists(pth1), f"path {f1.expand_root(pth1)} does not exist"
    if f1.isdir(pth1):
        copy_dir(f1, pth1, f2, pth2)
    else:
        # Auto-complete filename when dst path is a directory
        if f2.isdir(pth2):
            pth2 += ('/' + pth1.split("/")[-1])
        copy_file(f1, pth1, f2, pth2)


cluster_cfg_file = __flags__.get_cluster_cfg_file(get_defaults()["clusters-in-local"])


def translate_opai_to_pai(opai_args: list):
    trans_table = {
        # cluster
        'cluster list': 'list-clusters',
        'cluster resources': 'cluster-resources',
        'cluster update': 'update-cluster',
        'cluster edit': 'edit-cluster',
        'cluster add': 'add-cluster',
        'cluster delete': 'delete-cluster',
        'cluster select': 'select-cluster',
        # job
        'job list': 'list-jobs',
        'job status': 'job-status',
        'job stop': 'stop-job',
        'job submit': 'submit',
        'job sub': 'sub',
        'job notebook': 'notebook-job',
        'job connect': 'connect-job'
    }
    for key, val in trans_table.items():
        a = key.split(' ')
        if a is not None and len(opai_args) >= len(a) and a == opai_args[:len(a)]:
            return [trans_table[key]] + opai_args[len(a):]
    return opai_args


def execute_pai_args(args: list):
    try:
        to_screen(f'Received arguments {args}', _type="debug")
        eng = CliRegistery()
        result = eng.process(args)
        if result:
            to_screen(result)
        return 0
    except Exception as identifier:
        to_screen(f"Error: {repr(identifier)}", _type="warn")
        return -1


def main_opai():
    return execute_pai_args(translate_opai_to_pai(sys.argv[1:]))


def main_pai():
    return execute_pai_args(sys.argv[1:])


if __name__ == '__main__':
    main_opai()
