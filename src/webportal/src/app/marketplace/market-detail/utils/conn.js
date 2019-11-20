const serverUri = 'http://localhost:8002';
const params = new URLSearchParams(window.location.search);

export async function fetchMarketItem() {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function updateMarketItem(
  id,
  name,
  author,
  createDate,
  updateDate,
  category,
  tags,
  introduction,
  description,
  jobConfig,
  submits,
  stars,
) {
  const url = `${serverUri}/api/v2/marketplace/items/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      name: name,
      author: author,
      createDate: createDate,
      updateDate: updateDate,
      category: category,
      tags: tags,
      introduction: introduction,
      description: description,
      jobConfig: jobConfig,
      submits: submits,
      stars: stars,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function deleteItem() {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function fetchStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/marketplace/items/${itemId}/${userName}`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(json);
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function addStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/marketplace/items/star`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId: itemId,
      userName: userName,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function deleteStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/marketplace/items/${itemId}/${userName}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}
