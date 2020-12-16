import * as webportalConfig from '../config/webportal.config';


const APIGATEWAY_MAP = {
    CH1B: 'apigw-ivip.yarn-prod-ch1b.ch1b.ap.gbl',
    CO4: 'apigw-ivip.yarn-prod-co4.co4.ap.gbl',
    BN2: 'apigw-ivip.yarn-prod-bn2.bn2.ap.gbl',
    BN1: 'apigw-ivip.yarn3-dev-bn1.bn1.ap.gbl',
    CH1: 'apigw-ivip.yarn-prod-ch1.ch1.ap.gbl',
};

const PORT_MAP = webportalConfig.apiGatewayPortmap;

function getApiGatewayDomainName(subclusterName) {
    let parts = subclusterName.split('-');
    if (/.*-\d+/.test(subclusterName)) {
        parts.pop(); // Remove number
    }
    let cluster = parts[parts.length - 1];
    if (cluster === undefined) { // Check for corner cases like subclusterName="1"
        throw new Error(`Invalid subcluster ${subclusterName}`);
    }
    let domainName = APIGATEWAY_MAP[cluster.toUpperCase()];
    if (domainName === undefined) {
        throw new Error(`Invalid subcluster ${subclusterName}`);
    }
    return domainName;
}

function getApiGateways(subclusterName) {
    let domainName;
    if (webportalConfig.preferredAgiCluster) {
        domainName = APIGATEWAY_MAP[webportalConfig.preferredAgiCluster];
        if (domainName === undefined) {
            throw new Error('Invalid preferred agi cluster');
        }
    } else {
        domainName = getApiGatewayDomainName(subclusterName);
    }
    return {
        RestServer: `https://${domainName}:${PORT_MAP.RestServer}`,
        Login: `https://${domainName}:${PORT_MAP.Login}`,
        ResourceManager: `https://${domainName}:${PORT_MAP.ResourceManager}`,
        HttpFS: `https://${domainName}:${PORT_MAP.HttpFS}`,
        SparkJobHistory: `https://${domainName}:${PORT_MAP.SparkJobHistory}`,
    };
}

const defaultApiGateways = getApiGateways(webportalConfig.subcluster);

export {
    getApiGateways,
    defaultApiGateways,
};
