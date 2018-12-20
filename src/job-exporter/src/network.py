#!/usr/bin/env python3
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

import re
import logging
import collections
import subprocess
import socket
import fcntl
import struct
import array

import utils

logger = logging.getLogger(__name__)

# We relay on iftop & lsof to implement network consumption statistic. We first get all
# network consuption by iftop, this command can run in any namespace, it will output
# connetion & connection's consumption in some duration(40s), this consumption is node wide
# statistic. We break this statistic down into container level by running lsof, lsof must
# run in container's PID namespace. This will collect all connection pairs in that namespace.
# If the container is running in host namespace, then, lsof will output connection pairs in
# node level instead of container level.
# So current implementation is not workable for container running in host PID namespace.
# Also since lsof can not capture most of short-lived connections, this workaround is useful
# only for long-lived connections.

# To bring lsof in container's PID namespace, job exporter needs to be in host PID namespace
# and is privileged. This has serious security issue since any people can exec into
# job-exporter container and have root access to system wide resources, we prevent this by
# enabling DenyEscalatingExec in kubernets,
# see https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#denyescalatingexec


def convert_to_byte(data):
    number = float(re.findall(r"(\d+(\.\d+)?)", data)[0][0])
    if "T" in data:
        return number * 1024 * 1024 * 1024 * 1024
    elif "G" in data:
        return number * 1024 * 1024 * 1024
    elif "M" in data:
        return number * 1024 * 1024
    elif "K" in data:
        return number * 1024
    else:
        return number


def iftop(interface, histogram, timeout):
    cmd = ["iftop", "-t", "-P", "-s", "1", "-L", "10000", "-B", "-n", "-N"]
    if interface is not None:
        cmd.extend(["-i", interface])

    try:
        output = utils.exec_cmd(
                cmd,
                stderr=subprocess.STDOUT, # also capture stderr output
                histogram=histogram, timeout=timeout)
        return parse_iftop(output)
    except subprocess.TimeoutExpired:
        logger.warning("iftop timeout")
    except Exception:
        logger.exception("exec iftop error")
        return None


# iftop return 2s, 10s, 40s connection duration data.
# duration can only could be 2 or 10 or 40.
def parse_iftop(iftop_output, duration=40):
    """ parse output of iftop to map which key is ip:port value is map of in/out statistic """
    result = collections.defaultdict(lambda : {"in": 0, "out": 0})
    raw = [line.strip() for line in iftop_output.splitlines()]
    data = []

    # only interested in part two divided by ----
    part = 0
    for line in raw:
        if "------------" in line:
            part += 1
            if part == 2:
                break
        else:
            if part == 1:
                data.append(line)

    for line_no in range(0, len(data), 2):
        line1 = data[line_no].split()
        line2 = data[line_no + 1].split()
        src = line1[1]
        dst = line2[0]

        if duration == 2:
            col_index = -4
        elif duration == 10:
            col_index = -3
        elif duration == 40:
            col_index = -2
        else:
            col_index = -2

        out_byte = convert_to_byte(line1[col_index])
        in_byte = convert_to_byte(line2[col_index])

        result[src]["in"] += in_byte
        result[src]["out"] += out_byte

        result[dst]["in"] += out_byte
        result[dst]["out"] += in_byte

    return result


def lsof(pid, histogram, timeout):
    """ use infilter to do setns https://github.com/yadutaf/infilter """
    if pid is None:
        return None

    try:
        output = utils.exec_cmd(["infilter", str(pid), "/usr/bin/lsof", "-i", "-n", "-P"],
                histogram=histogram,
                stderr=subprocess.STDOUT, # also capture stderr output
                timeout=timeout)
        return parse_lsof(output)
    except subprocess.TimeoutExpired:
        logger.warning("lsof timeout")
    except subprocess.CalledProcessError as e:
        logger.warning("infilter lsof returns %d, output %s", e.returncode, e.output)
    except Exception:
        logger.exception("exec lsof error")
        return None


def parse_lsof(lsof_output):
    """ parse output by lsof. For each socket link, lsof will output two lines,
    return a map with string pid as key and list of ip:port that pid is connected from """
    conns = collections.defaultdict(lambda : set())
    data = [line.strip() for line in lsof_output.splitlines()[1:]]

    for line in data:
        if "ESTABLISHED" in line:
            parts = line.split()
            if len(parts) == 10:
                pid = parts[1]
                src = parts[8].split("->")[0]
                conns[pid].add(src)
            else:
                logger.warning("unknown format of lsof %s", parts)
                continue

    return conns


# NOTE: we assume lsof_result contains network consumption only in container,
# This assumption will be break if container has host pid namespace, in this case
# the network metrics contains all network consumption in its node.
def get_container_network_metrics(all_conns, lsof_result):
    """ return in_byte, out_byte of container """
    if all_conns is None or lsof_result is None:
        return 0, 0

    in_byte = 0
    out_byte = 0

    for container_pid, container_conns in lsof_result.items():
        for conn in container_conns:
            if conn in all_conns:
                in_byte += all_conns[conn]["in"]
                out_byte += all_conns[conn]["out"]

    return in_byte, out_byte


def format_ip(addr):
    return str(addr[0]) + "." + \
           str(addr[1]) + "." + \
           str(addr[2]) + "." + \
           str(addr[3])


def get_interfaces():
    """ get all network interfaces we see, return map with interface name as key, and ip as value """
    max_possible = 128
    bytes = max_possible * 32
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    names = array.array("B", b"\0" * bytes)
    outbytes = struct.unpack("iL", fcntl.ioctl(
        s.fileno(),
        0x8912,  # SIOCGIFCONF
        struct.pack("iL", bytes, names.buffer_info()[0])
    ))[0]

    namestr = names.tostring()

    result = {}
    for i in range(0, outbytes, 40):
        name = namestr[i:i+16].split(b"\0", 1)[0].decode("ascii")
        ip   = namestr[i+20:i+24]
        result[name] = format_ip(ip)
    return result


def get_ip_can_access_internet(target="hub.docker.com"):
    """ return None on error """
    s = socket.socket(
            socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((target, 80))
    except socket.gaierror:
        logger.exception("failed to connect to %s", target)
        return None
    except Exception:
        logger.exception("unknown exception when tying to connect %s", target)

    return s.getsockname()[0]


def try_to_get_right_interface(configured_ifs):
    """ try to return a right interface so that iftop can listen on """
    ifs = get_interfaces()

    logger.debug("found interfaces %s", ifs)

    for interface in configured_ifs.split(","):
        interface = interface.strip()
        if interface in ifs:
            return interface

    logger.info("didn't find correct network interface in this node, configured %s, found %s",
            configured_ifs, ifs)

    ip = get_ip_can_access_internet()
    if ip is not None:
        for if_name, if_ip in ifs.items():
            if ip == if_ip:
                return if_name

    return None
