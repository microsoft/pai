const webportalConfig = require('../../../config/webportal.config');
const serverUri = webportalConfig.restServerUri;

export async function fetchMarketItemList() {
  const url = `${serverUri}/api/v2/marketplace/items`;
  const res = await fetch(url);
  const json = await res.json();
  // order by updateDate
  json.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function createMarketItem(marketItem) {
  const url = `${serverUri}/api/v2/marketplace/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: marketItem.name,
      author: marketItem.author,
      category: marketItem.category,
      introduction: marketItem.introduction,
      description: marketItem.description,
      jobConfig: marketItem.jobConfig,
      submits: marketItem.submits,
      starNumber: marketItem.stars,
      tags: marketItem.tags,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json);
  }
}
