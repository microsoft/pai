'use strict';
const config = require('@pai/config');
const subClusterConfig = require('@pai/config/subclusters.config');
const createError = require('@pai/utils/error');

function getSubClusterInfoByName(subClusterName) {
    if (subClusterName.indexOf('-') === -1) {
        subClusterName = subClusterName + '-0'; // handle stale name rule
    }
    let matchSubClusters = subClusterConfig.Clusters.filter((sc) => sc.Name.toLowerCase() === subClusterName.toLowerCase());
    switch (matchSubClusters.length) {
        case 0:
            return null;
        case 1:
            return matchSubClusters[0];
        case 2:
            throw createError.unknown(`More than 1 subclusters with name [${subClusterName}]`);
    }
}

function getCurrentSubClusterInfo() {
    let subClusterInfo = getSubClusterInfoByName(config.subCluster);
    if (subClusterInfo === null) {
        throw createError.unknown(`Subcluster [${config.subCluster}] not found in config`);
    }
    return subClusterInfo;
}

module.exports = {
    getSubClusterInfoByName,
    getCurrentSubClusterInfo,
};
