import * as axios from 'axios';

import * as webportalConfig from '../config/webportal.config';
import {getApiGateways} from './api-gateway';
import {getSubclusterConfigByName, getSelectedSubclusterConfig} from './subcluster';
import {checkToken} from '../user/user-auth/user-auth.component';

const isDebugMode = webportalConfig.debug === true; // .debug might be undefined
const debugLoginServerAddress = webportalConfig.debugLoginServerAddress; // Currently all beds use YARNTS@CH1B as login server.
const useApigateway = !isDebugMode; // Can't use api gateway for local debug. Because local MT Token used is issued by local rest server using TEST credencials, but accessing api gateway needs PROD credencials.

/** Add /proxy as prefix for rest-server calls */
function useProxy(config) { // TODO: read from config
  config.baseURL = config.baseURL ? `${webportalConfig.proxyUri}/${config.baseURL}` : webportalConfig.proxyUri;
  return config;
}

/** Add /cache as prefix for application info calls */
function useCache(config) { // TODO: read from config
  config.baseURL = config.baseURL ? `${webportalConfig.cacheUri}/${config.baseURL}` : webportalConfig.cacheUri;
  return config;
}

/** Check and add Bearer token in headers */
function withToken(config) {
  let token = checkToken(true);
  config.headers.common.Authorization = `Bearer ${token}`;
  return config;
}

/** Use this function to get clients which will use different baseURLs according to current selected subcluster */
function getClientsForSelectedSubcluster() {
  const restServerClient = axios.create();
  const sparkJobHistoryClient = axios.create();
  const resourceManagerClient = axios.create();
  const httpFSClient = axios.create();

  // Axios applies interceptors in reverse order. I add useProxy at first, so the URL can be converted at last.
  restServerClient.interceptors.request.use(useProxy);
  sparkJobHistoryClient.interceptors.request.use(useCache);
  resourceManagerClient.interceptors.request.use(useCache);
  httpFSClient.interceptors.request.use(useCache);

  if (useApigateway) {
    // Use apigateway url & add subcluster param. Evaluate subcluster config value when making request
    restServerClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = getApiGateways(subclusterConfig.Name).RestServer;
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    });
    restServerClient.interceptors.request.use(withToken);

    sparkJobHistoryClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = getApiGateways(subclusterConfig.Name).SparkJobHistory;
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    sparkJobHistoryClient.interceptors.request.use(withToken);

    resourceManagerClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = getApiGateways(subclusterConfig.Name).ResourceManager;
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    resourceManagerClient.interceptors.request.use(withToken);

    httpFSClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = getApiGateways(subclusterConfig.Name).HttpFS;
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    httpFSClient.interceptors.request.use(withToken);
  } else {
    // use corresponding base URL as needed
    restServerClient.interceptors.request.use((config) => {
      if (webportalConfig.restServerUri) {
        config.baseURL = webportalConfig.restServerUri;
      } else {
        let subclusterConfig = getSelectedSubclusterConfig();
        config.baseURL = subclusterConfig.RestServerUri;
      }
      return config;
    });
    restServerClient.interceptors.request.use(withToken);

    sparkJobHistoryClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = subclusterConfig.sparkHistoryServerUri;
      return config;
    });

    resourceManagerClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = subclusterConfig.resourceManagerUri;
      return config;
    });

    httpFSClient.interceptors.request.use((config) => {
      let subclusterConfig = getSelectedSubclusterConfig();
      config.baseURL = subclusterConfig.HttpFSUri;
      return config;
    });
  }

  return {
    restServerClient,
    sparkJobHistoryClient,
    resourceManagerClient,
    httpFSClient,
  }
}

/** Use this function to get clients for certain subcluster */
function getClientsForSubcluster(subclusterName) {
  const subclusterConfig = getSubclusterConfigByName(subclusterName);
  if (subclusterConfig === null) {
    throw new Error(`Invalid subcluster name ${subclusterName}`);
  }

  const restServerClient = axios.create();
  const loginClient = axios.create();
  const sparkJobHistoryClient = axios.create();
  const resourceManagerClient = axios.create();
  const httpFSClient = axios.create();
  
  restServerClient.interceptors.request.use(useProxy);
  loginClient.interceptors.request.use(useProxy);
  sparkJobHistoryClient.interceptors.request.use(useCache);
  resourceManagerClient.interceptors.request.use(useCache);
  httpFSClient.interceptors.request.use(useCache);

  if (useApigateway) {
    const apiGateways = getApiGateways(subclusterName);

    restServerClient.defaults.baseURL = apiGateways.RestServer;
    restServerClient.interceptors.request.use((config) => {
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    });
    restServerClient.interceptors.request.use(withToken);
    
    // login api gateway doesn't need subcluster param or authorization header
    loginClient.defaults.baseURL = apiGateways.Login;

    sparkJobHistoryClient.defaults.baseURL = apiGateways.SparkJobHistory;
    sparkJobHistoryClient.interceptors.request.use((config) => {
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    sparkJobHistoryClient.interceptors.request.use(withToken);
    
    resourceManagerClient.defaults.baseURL = apiGateways.ResourceManager;
    resourceManagerClient.interceptors.request.use((config) => {
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    resourceManagerClient.interceptors.request.use(withToken);

    
    httpFSClient.defaults.baseURL = apiGateways.HttpFS;
    httpFSClient.interceptors.request.use((config) => {
      if (config.params !== undefined) {
        config.params.subcluster = subclusterConfig.subCluster;
      } else {
        config.params = {
          subcluster: subclusterConfig.subCluster,
        }
      }
      return config;
    })
    httpFSClient.interceptors.request.use(withToken);
  } else {
    // use corresponding base URL as needed
    if (webportalConfig.restServerUri) {
      restServerClient.defaults.baseURL = webportalConfig.restServerUri;
      loginClient.defaults.baseURL = webportalConfig.restServerUri;
    } else {
      restServerClient.defaults.baseURL = subclusterConfig.RestServerUri;
      loginClient.defaults.baseURL = debugLoginServerAddress; // Use ch1b login server in debug mode if REST_SERVER_URI is not specified.
    }
    restServerClient.interceptors.request.use(withToken);

    sparkJobHistoryClient.defaults.baseURL = subclusterConfig.sparkHistoryServerUri;

    resourceManagerClient.defaults.baseURL = subclusterConfig.resourceManagerUri;

    httpFSClient.defaults.baseURL = subclusterConfig.HttpFSUri;
  }

  return {
    restServerClient,
    loginClient,
    sparkJobHistoryClient,
    resourceManagerClient,
    httpFSClient,
  }
}

const defaultClients = getClientsForSubcluster(webportalConfig.subcluster);
const defaultRestServerClient = defaultClients.restServerClient;
const loginClient = defaultClients.loginClient;
const {
  restServerClient,
  sparkJobHistoryClient,
  resourceManagerClient,
  httpFSClient,
} = getClientsForSelectedSubcluster();

export {
  defaultRestServerClient,
  restServerClient,
  loginClient,
  sparkJobHistoryClient,
  resourceManagerClient, // Not Used
  httpFSClient, // Not used
  getClientsForSubcluster,
  getClientsForSelectedSubcluster,
  useProxy,
  useCache,
};
