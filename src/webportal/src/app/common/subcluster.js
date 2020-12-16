import * as webportalConfig from '../config/webportal.config';
import * as subclusterConfig from '../config/subclusters.config';


/** Get subcluster config by filtering "Name" property */
function getSubclusterConfigByName(name) {
	if (!/.*-\d+/.test(name)) { // For YarnTS machines
		name = name + '-0'; // Just use YarnTS0 config for now
	}
	let matchSubclusters = subclusterConfig.Clusters.Cluster.filter((sc) => sc.Name.toLowerCase() === name.toLowerCase());
	switch (matchSubclusters.length) {
		case 0:
			return null;
		case 1:
			return matchSubclusters[0];
		case 2:
			throw new Error(`More than 1 subclusters with name [${name}]`);
	}
}

/** Get subcluster config by filtering "subcluster" property */
function getSubclusterConfigByDisplayName(displayName) {
	let matchSubclusters = subclusterConfig.Clusters.Cluster.filter((sc) => sc.subCluster.toLowerCase() === displayName.toLowerCase());
	switch (matchSubclusters.length) {
		case 0:
			return null;
		case 1:
			return matchSubclusters[0];
		case 2:
			throw new Error(`More than 1 subclusters with display name [${displayName}]`);
	}
}

const defaultSubclusterConfig = getSubclusterConfigByName(webportalConfig.subcluster);
if (defaultSubclusterConfig === null) {
	throw new Error(`Unable to find config for default subcluster ${webportalConfig.subcluster}`);
}

function getSelectedSubclusterConfig() {
	// subcluster in URL has highest priority
	let params = new URLSearchParams(window.location.search);
	let subclusterDisplayName = params.get('subCluster');
	if (subclusterDisplayName !== null) {
		// The original code refreshs cookies here. But I believe it should be refreshed somewhere else.
		return getSubclusterConfigByDisplayName(subclusterDisplayName);
	}
	// then in cookies
	subclusterDisplayName = cookies.get('subClusterUri'); // "cookies" is from package "js-cookie"
	if (subclusterDisplayName !== undefined) {
		return getSubclusterConfigByDisplayName(subclusterDisplayName);
	}
	// else use default
	return defaultSubclusterConfig;
}

/**
 * 
 * @param {string} dataCenter String like "BASIC-co4", "MTPRIME-bn2", etc... Basically tier + cluster
 */
function getSubclusterNameByDataCenter(dataCenter) {
	const [tier, cluster] = dataCenter.split('-');
	let subclusterName;
	if (tier === 'BASIC') {
	  subclusterName = `${cluster}-0`; // There is only one Spark History Server for each cluster. So I just use cluster-0's SHS address here.
	} else if (tier === 'MTPRIME') {
	  subclusterName = `MTPrime-${cluster}-0`;
	} else if (tier === 'MTCMPL') {
	  subclusterName = `MTCmpl-${cluster}-0`;
	} else {
	  throw new Error(`Invalid runningDatacenter ${dataCenter}`);
	}
	return subclusterName;
}

export {
	defaultSubclusterConfig,
	getSubclusterConfigByName,
	getSubclusterConfigByDisplayName,
	getSelectedSubclusterConfig,
	getSubclusterNameByDataCenter,
};
