import requests
import logging
import json

def setup_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter('[%(asctime)s] %(name)s:%(levelname)s: %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger



class YarnReader(object):
    def __init__(self, yarn_url):
        self.yarn_url = yarn_url
        self.node_status_url = "{}/ws/v1/cluster/nodes".format(yarn_url)
        self.node_list = {}



    def load_node_list(self):
        response = requests.get(self.node_status_url)
        if response.status_code != requests.codes.ok:
            logger.error("can't connect to yarn")
            return
        response_dict = response.json()
        for node in response_dict["nodes"]["node"]:
            host, state = node["nodeHostName"], node["state"]
            self.node_list[host] = state
        logger.debug(self.node_list)


    def get_nodes(self):
        pass

def main():
    yarn_reader = YarnReader("http://10.151.40.133:8088")
    yarn_reader.load_node_list()

if __name__ == "__main__":
    logger = setup_logger()
    main()
