
const serverUri = 'http://localhost:8002';
const params = new URLSearchParams(window.location.search);

export async function fetchMarketItem() {
  const url = `${serverUri}/${params.get('itemName')}`;
  //const url = `${serverUri}`;
  const res = await fetch(url);
  const json = await res.json();
  //console.table(json);
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function fetchJobConfig_marketplace() {
  
}

export async function fetchTaskRoles_marketplace() {

}

export async function updateMarketItem(name, category, introduction, author, description) {
  const url = `${serverUri}/${params.get('itemName')}`;
  const res = await fetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      "name": name,
      "category": category,
      "introduction": introduction,
      "author": author,
      "description": description
    })
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  }else {
    throw new Error(json.message);
  }
}