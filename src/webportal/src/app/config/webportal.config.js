"use strict";
const params = new URLSearchParams(window.location.search);
const subCluster = params.get('subCluster');

if (subCluster != null) {
    cookies.set('subClusterUri', subCluster, { expires: 7 });
}
module.exports = {
    ...window.ENV,
};
