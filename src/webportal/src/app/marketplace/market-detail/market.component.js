//
const deleteMarketItem = name => {
    if (name === 'default') return false;
    const res = confirm(
      `Notes:\r1. If there are jobs of this virtual cluster still running, it cannot be deleted.\r2. The capacity of this virtual cluster will be returned to default virtual cluster.\r\rAre you sure to delete ${name}?`,
    );
    if (!res) return false;
    userAuth.checkToken(token => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v2/virtual-clusters/${name}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        contentType: 'application/json; charset=utf-8',
        type: 'DELETE',
        dataType: 'json',
        success: data => {
          const params = new URLSearchParams(window.location.search);
          const vcName = params.get('vcName');
          loadData(vcName);
          alert(data.message);
        },
        error: (xhr, textStatus, error) => {
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
          if (res.code === 'UnauthorizedUserError') {
            userLogout();
          }
        },
      });
    });
  };
  
  //
  const editMarketItem = (title, categories, languages, author, description) => {
    if (titile === 'default') return false;
    $('input[name="titleEdit"]').val(title);
    $('input[name="categoriesEdit"]').val(categories);
    /*
    $('input[name="languagesEdit"]').val(languages);
    $('input[name="authorEdit"]').val(author);
    $('input[name="description"]').val(description);
    */
    $('#marketItemEdit').modal('show');
  };

window.deleteMarketItem = deleteMarketItem;
window.editMarketItem = editMarketItem;