import json
import sys
import requests
import re
import socket,fcntl,struct

def get_ip_address(ifname):
    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    return socket.inet_ntoa(fcntl.ioctl(s.fileno(), 0x8915, struct.pack('256s',ifname[:15]))[20:24])

def extractData(regex, content, index=1): 
  r = ''
  p = re.compile(regex) 
  m = p.search(content) 
  if m: 
    r = m.group(index) 
  return r 

def parseLine(line, inOrOut):
    line = line.split(" ")
    metric = line[1]
    regex = r',name=\"(.*)\",n'
    index = 1
    name = extractData(regex, line[0], index)
    return {"name": name, "value": metric, "inOut": inOrOut}

def get_network_metric():
    cadvisor_metrics = requests.get("http://{}:4194/metrics".format(get_ip_address('eth0'))).text
    cadvisor_metrics = cadvisor_metrics.split("\n")
    inNet = []
    outNet = [] 

    for line in cadvisor_metrics:
        if "container_network_receive_bytes_total" in line:
                result = parseLine(line, "in")
                inNet.append(result);

        if "container_network_transmit_bytes_total" in line: 
                result = parseLine(line, "out")
                outNet.append(result); 
    return inNet, outNet

def main(argv):
    get_text()

if __name__ == "__main__":
    main(sys.argv[1:])