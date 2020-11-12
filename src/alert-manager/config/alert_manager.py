#!/usr/bin/env python

import copy
import collections
import os

def update_nested_dict(dict_original, dict_update):
    """
    keep original key in nested dict if not present in the new dict
    """
    for key, val in dict_update.iteritems():
        if isinstance(val, collections.Mapping):
            dict_original[key] = update_nested_dict(dict_original.get(key, {}), val)
        else:
            dict_original[key] = val
    return dict_original

class AlertManager(object):
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    def get_master_ip(self):
        for host_conf in self.cluster_conf["machine-list"]:
            if "pai-master" in host_conf and host_conf["pai-master"] == "true":
                return host_conf["hostip"]

    def validation_pre(self):
        return True, None

    def get_email_templates(self):
        # get all template folders
        templates_path = os.path.abspath(os.path.join(os.path.abspath(__file__), '../../deploy/alert-templates'))
        template_dirs = os.listdir(templates_path)

        # the template folder is valid if 'html.ejs' and 'subject.ejs' both exist in the dir
        templates = []
        for dir_name in template_dirs:
            template_path = os.path.join(templates_path, dir_name)
            if os.path.isdir(template_path):
                contents = os.listdir(template_path)
                if set(['html.ejs', 'subject.ejs']).issubset(set(contents)):
                    templates.append(dir_name)
        return templates
    
    def run(self):
        result = update_nested_dict(self.default_service_conf, self.service_conf)

        # check if email_configs is properly configured
        if result.get("alert-handler") is not None and \
            result["alert-handler"].get("email-configs") is not None and \
                result["alert-handler"]["email-configs"].get("admin-receiver") is not None and \
                result["alert-handler"]["email-configs"].get("smtp-host") is not None and \
                result["alert-handler"]["email-configs"].get("smtp-port") is not None and \
                result["alert-handler"]["email-configs"].get("smtp-from") is not None and \
                result["alert-handler"]["email-configs"].get("smtp-auth-username") is not None and \
                result["alert-handler"]["email-configs"].get("smtp-auth-password") is not None:
            email_configured = True
        else:
            email_configured = False
        
        if email_configured:
            result["alert-handler"]["email-configs"]["templates"] = self.get_email_templates()

        # check if `pai-bearer-token` is properly configured
        if result.get("alert-handler") is not None and \
            result["alert-handler"].get("pai-bearer-token") is not None:
            token_configured = True
        else:
            token_configured = False

        if email_configured and token_configured:
            result["alert-handler"]["configured"] = True
            result["actions-available"].extend(["email-admin", "email-user", "stop-jobs", "tag-jobs"])
        elif email_configured:
            result["alert-handler"]["configured"] = True
            result["actions-available"].append("email-admin")
        elif token_configured:
            result["alert-handler"]["configured"] = True
            result["actions-available"].extend(["stop-jobs", "tag-jobs"])
        else:
            result["alert-handler"]["configured"] = False

        result["host"] = self.get_master_ip()
        result["url"] = "http://{0}:{1}".format(self.get_master_ip(), result["port"])

        return result

    def validation_post(self, conf):
        port = conf["alert-manager"].get("port")
        if type(port) != int:
            msg = "expect port in alert-manager to be int but get %s with type %s" % \
                    (port, type(port))
            return False, msg
        return True, None
