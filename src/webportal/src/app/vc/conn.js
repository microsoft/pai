
import {getClientsForSelectedSubcluster} from '../common/http-client';


export async function fetchActivatedAppsFromResourceManager(vcName) {
  const resourceManagerClient = getClientsForSelectedSubcluster().resourceManagerClient;
  const url = `/ws/v1/cluster/apps?queue=${vcName}&only-list-activated-apps=true`;
  const res = await resourceManagerClient.get(url, {
    timeout: 3000,
  });
  return res.data;
}

export async function fetchAppsFromRestServer(vcName) {
  const restServerClient = getClientsForSelectedSubcluster().restServerClient;
  const url = `/api/v2/mp/jobs?virtualCluster=${vcName}`;
  const res = await restServerClient.get(url, {
    timeout: 60000,
  });
  return res.data;
}
