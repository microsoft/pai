import { MarketItem } from '../../models/market-item';
const webportalConfig = require('../../../config/webportal.config');

const serverUri = webportalConfig.restServerUri;
const params = new URLSearchParams(window.location.search);

export async function fetchMarketItem() {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url);
  const json = await res.json();
  if (res.ok) {
    const marketItem = new MarketItem(
      json.id,
      json.name,
      json.author,
      json.createAt,
      json.updateAt,
      json.category,
      json.tags,
      json.introduction,
      json.description,
      json.jobConfig,
      json.submits,
      json.starNumber,
    );
    return marketItem;
  } else {
    throw new Error(json.message);
  }
}

export async function updateMarketItem(
  name,
  author,
  category,
  introduction,
  description,
  jobConfig,
  submits,
  starNumber,
  tags,
) {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      author: author,
      category: category,
      introduction: introduction,
      description: description,
      jobConfig: jobConfig,
      submits: submits,
      starNumber: starNumber,
      tags: tags,
    }),
  });
  const text = await res.text();
  if (res.ok) {
    return text;
  } else {
    throw new Error(text);
  }
}

export async function deleteItem() {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  const text = await res.text();
  if (res.ok) {
    return text;
  } else {
    throw new Error(text);
  }
}

export async function fetchStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/user/${userName}/starItems/${itemId}`;
  const res = await fetch(url);

  if (res.ok) {
    return true;
  } else {
    const text = await res.text();
    throw new Error(text);
  }
}

export async function addStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/user/${userName}/starItems/${itemId}`;
  const res = await fetch(url, {
    method: 'PUT',
  });
  const text = await res.text();
  if (res.ok) {
    return text;
  } else {
    throw new Error(text);
  }
}

export async function deleteStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/user/${userName}/starItems/${itemId}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  const text = await res.text();
  if (res.ok) {
    return text;
  } else {
    throw new Error(text);
  }
}
