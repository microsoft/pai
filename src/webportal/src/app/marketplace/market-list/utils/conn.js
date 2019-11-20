const serverUri = 'http://localhost:8002';

export async function fetchMarketItemList() {
  const url = `${serverUri}/api/v2/marketplace/items`;
  const res = await fetch(url);
  const json = await res.json();

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
      id: marketItem.id,
      name: marketItem.name,
      author: marketItem.author,
      createDate: marketItem.createDate.toString(),
      updateDate: marketItem.updateDate.toString(),
      category: marketItem.category,
      tags: marketItem.tags,
      introduction: marketItem.introduction,
      description: marketItem.description,
      jobConfig: marketItem.jobConfig,
      submits: marketItem.submits,
      stars: marketItem.stars,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}
