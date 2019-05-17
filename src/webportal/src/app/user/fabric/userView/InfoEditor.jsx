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

import React, {useRef} from 'react';

import PropTypes from 'prop-types';

export default function InfoEditor({user: {username = '', admin = '', virtualCluster = '', hasGithubPAT = false}, updateUserAccount, updateUserVC, updateUserGithubPAT, hideEditUser}) {
  const inputPassword = useRef(null);
  const chkAdmin = useRef(null);
  const chkVc = useRef(null);
  const chkGithubPAT = useRef(null);

  const handleUpdateAccount = (event) => {
    const password = inputPassword.current.value;
    const isAdmin = chkAdmin.current.checked;
    updateUserAccount(username, password, isAdmin);
    event.preventDefault();
  };

  const handleUpdateUserVC = (event) => {
    const vcList = chkVc.current.value;
    updateUserVC(username, vcList);
    event.preventDefault();
  };

  const handleUpdateGithubPAT = (event) => {
    const githubPAT = chkGithubPAT.current.value;
    updateUserGithubPAT(username, githubPAT);
    event.preventDefault();
  };

  // TODO: Remove bootstrap style when we have a new design
  return (
    <div className="modal-content">
      <div className="modal-header">
        <h4 className="modal-title">Edit information of {username}</h4>
      </div>
      <div className="modal-body">
        <div className="box-header with-border user-edit-border">
          <h3 className="box-title">Change Userinfo</h3>
        </div>
        <form id="form-update-account" className="form-register" onSubmit={handleUpdateAccount} >
          <label htmlFor="inputPassword" className="sr-only">Password</label>
          <input type="password" name="password" ref={inputPassword} id="update-account-input-password" className="form-control" placeholder="******" />
          <div className="checkbox">
            <label>
              <input type="checkbox" name="admin" ref={chkAdmin} defaultChecked={admin === 'true' ? true : false} />
              Admin user
            </label>
          </div>
          <button className="btn btn-lg btn-primary btn-block" type="button" onClick={handleUpdateAccount}>Change Userinfo</button>
        </form>
        {admin !== 'true' &&
          <React.Fragment>
            <div className="box-header with-border user-edit-border">
              <h3 className="box-title">Update Virtual Clusters</h3>
            </div>
            <form id="form-update-virtual-cluster" className="form-register" onSubmit={handleUpdateUserVC}>
              <label htmlFor="inputVirtualCluster" className="sr-only">VirtualCluster</label>
              <input type="text" name="virtualCluster" ref={chkVc} id="update-virtual-cluster-input-virtualCluster" className="form-control"
                placeholder="Virtual Clusters (e.g. vc1,vc2)" defaultValue={virtualCluster} />
              <button className="btn btn-lg btn-primary btn-block" type="button" onClick={handleUpdateUserVC}> Update Virtual Clusters</button>
            </form>
          </React.Fragment>
        }
        <div className="box-header with-border user-edit-border">
          <h3 className="box-title">Update Github PAT</h3>
        </div>
        <form id="form-update-github-token" className="form-register" onSubmit={handleUpdateGithubPAT}>
          <label htmlFor="inputGithubPAT" className="sr-only">GithubPAT</label>
          <input type="text" name="githubPAT" ref={chkGithubPAT} id="update-github-token-input-githubPAT" className="form-control"
            placeholder={hasGithubPAT ? '******' : 'N/A'} />
          <button className="btn btn-lg btn-primary btn-block" type="button" onClick={handleUpdateGithubPAT}>Update Github PAT</button>
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-default" onClick={hideEditUser}>Close</button>
      </div>
    </div>
  );
}

InfoEditor.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    admin: PropTypes.string,
    virtualCluster: PropTypes.string,
    hasGithubPAT: PropTypes.bool,
  }),
  updateUserAccount: PropTypes.func,
  updateUserVC: PropTypes.func,
  updateUserGithubPAT: PropTypes.func,
  hideEditUser: PropTypes.func,
};
