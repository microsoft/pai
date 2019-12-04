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
  name,
  updateDate,
  category,
  tags,
  introduction,
  description,
) {
  const url = `${serverUri}/api/v2/marketplace/items/${params.get('itemId')}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      updateDate: updateDate,
      category: category,
      tags: tags,
      introduction: introduction,
      description: description,
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

  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function updateStarRelation(itemId, userName) {
  const url = `${serverUri}/api/v2/marketplace/items/${itemId}/${userName}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
