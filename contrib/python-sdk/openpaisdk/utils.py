"""
common functions to
"""
from requests import request, Response


def update_obj(a, b, func: str='update'):
    """
    update objecgt a with b (if b is not None)
    
    Args:
        a ([type]): destination object
        b ([type]): object to be merged
    """
    f = getattr(a, func)
    assert callable(f), 'method {} is not callable'.format(func)
    if b is not None:
        f(b)
    return a


def get_response(
    path: str, 
    headers: dict={'Content-Type': 'application/json'}, 
    body: dict=dict(), 
    method: str='POST', 
    allowed_status = [200], # type: list[int]
    max_try: int=1) -> Response:
    """
    Send request to REST server and get the response.
    
    Args:
        path (str): REST server path
        headers (dict, optional): Defaults to {'Content-Type': 'application/json'}. request headers
        body (dict, optional): Defaults to dict(). data body of the request (default is json format)
        method (str, optional): Defaults to 'POST'. POST / PUT / GET
        allowed_status (list, optional): Defaults to [200]. raise exception if the status_code of response not in the list
    
    Returns:
        [Response]: request response
    """
    num, successful = 0, False
    while num < max_try:
        num += 1
        response = request(
            method, path, headers=headers, json=body
        )
        if response.status_code in allowed_status:
            successful = True
            break
    assert successful, (response.status_code, response.reason)
    return response