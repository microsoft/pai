// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import config from '../../config/webportal.config';

export async function login(username, password, expires = 7) {
  const res = await fetch(`${config.restServerUri}/api/v1/authn/basic/login`, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      expiration: expires * 24 * 60 * 60,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  if (res.ok) {
    const data = await res.json();
    if (data.error) {
      throw new Error(data.message);
    } else {
      cookies.set('user', data.user, { expires });
      cookies.set('token', data.token, { expires });
      cookies.set('admin', data.admin, { expires });
    }
  } else {
    const data = await res.json();
    throw new Error(data.message);
  }
}
