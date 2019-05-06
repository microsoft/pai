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

import React, {useState, useEffect, useMemo, useRef} from 'react';

import {initializeIcons} from 'office-ui-fabric-react';
import {Fabric, Stack} from 'office-ui-fabric-react';
import {debounce} from 'lodash';

import {MaskSpinnerLoading} from '../../../components/loading';
import MessageBox from '../components/MessageBox';
import webportalConfig from '../../../config/webportal.config';
import userAuth from '../../user-auth/user-auth.component';

import Context from './Context';
import TopBar from './TopBar';
import Table from './Table';
import Ordering from './Ordering';
import Filter from './Filter';
import Pagination from './Pagination';
import Paginator from './Paginator';

require('bootstrap/js/modal.js');
const userEditModalComponent = require('./user-edit-modal-component.ejs');
require('./user-edit-modal-component.scss');

initializeIcons();

export default function UserView() {
  const [loading, setLoading] = useState({'show': false, 'text': ''});
  const showLoading = (text) => {
    setLoading({'show': true, 'text': text});
  };
  const hideLoading = () => {
    setLoading({'show': false});
  };

  const [messageBox, setMessageBox] = useState({text: '', confirm: false, dismissedCallback: undefined, okCallback: undefined, cancelCallback: undefined});
  const showMessageBox = (value) => {
    if (value == undefined || value == null) {
      setMessageBox({text: ''});
    } else if (typeof value === 'string') {
      setMessageBox({text: value});
    } else {
      setMessageBox(value);
    }
  };
  const hideMessageBox = () => {
    if (messageBox.dismissedCallback) {
      messageBox.dismissedCallback();
    }
    setMessageBox({text: ''});
  };

  const [allUsers, setAllUsers] = useState([]);
  const refreshAllUsers = () => {
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user`,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
          setAllUsers(data);
        },
        error: (xhr) => {
          const res = JSON.parse(xhr.responseText);
          showMessageBox({
            text: res.message,
            dismissedCallback: () => {
              window.location.href = '/';
            },
          });
        },
      });
    });
  };
  useEffect(refreshAllUsers, []);

  const initialFilter = useMemo(() => {
    const filter = new Filter();
    filter.load();
    return filter;
  });
  const [filter, setFilter] = useState(initialFilter);
  useEffect(() => filter.save(), [filter]);

  const [filteredUsers, setFilteredUsers] = useState(null);
  const {current: applyFilter} = useRef(debounce((allUsers, /** @type {Filter} */filter) => {
    setFilteredUsers(filter.apply(allUsers || []));
  }, 200));
  useEffect(() => {
    applyFilter(allUsers, filter);
  }, [applyFilter, allUsers, filter]);

  const [pagination, setPagination] = useState(new Pagination());
  useEffect(() => {
    setPagination(new Pagination(pagination.itemsPerPage, 0));
  }, [filteredUsers]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const getSelectedUsers = () => {
    if (allSelected) {
      return pagination.apply(ordering.apply(filteredUsers || []));
    } else {
      return selectedUsers;
    }
  };

  const [ordering, setOrdering] = useState(new Ordering());

  const addUser = () => {
    window.location.href = '/register.html';
  };

  const importCSV = () => {
    window.location.href = '/batch-register.html';
  };

  const removeUser = (user) => {
    const token = userAuth.checkToken();
    return $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user`,
      data: {
        username: user.username,
      },
      type: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
    });
  };

  const removeUserRecursively = (selected, index) => {
    if (index == 0) {
      showLoading('Processing...');
    }
    if (index >= selected.length) {
      hideLoading();
      setTimeout(() => {
        showMessageBox({
          text: `Remove ${selected.length == 1 ? 'user' : 'users'} successfully.`,
          dismissedCallback: () => {
            setAllUsers([]);
            refreshAllUsers();
          },
        });
      }, 100);
    } else {
      const user = selected[index];
      removeUser(user).then(() => {
        removeUserRecursively(selected, ++index);
      }, (xhr) => {
        hideLoading();
        setTimeout(() => {
          const res = JSON.parse(xhr.responseText);
          showMessageBox({
            text: res.message,
            dismissedCallback: () => {
              setAllUsers([]);
              refreshAllUsers();
            },
          });
        }, 100);
      });
    }
  };

  const removeUsers = () => {
    const selected = getSelectedUsers();
    showMessageBox({
      text: `Are you sure to remove ${selected.length == 1 ? 'the user' : 'these users'}?`,
      confirm: true,
      okCallback: () => {
        removeUserRecursively(selected, 0);
      },
    });
  };

  const editUser = (user) => {
    showEditInfo(user.username, user.admin, user.virtualCluster, user.hasGithubPAT);
  };

  const showEditInfo = (username, isAdmin, vcList, hasGithubPAT) => {
    $('#modalPlaceHolder').html(userEditModalComponent({
      'username': username,
      'isAdmin': String(isAdmin),
      'vcList': vcList,
      'hasGithubPAT': String(hasGithubPAT),
      updateUserVc,
      updateUserAccount,
      updateUserGithubPAT,
    }));
    $('#userEditModal').modal('show');
  };

  const updateUserVc = (username) => {
    const virtualCluster = $('#form-update-virtual-cluster :input[name=virtualCluster]').val();
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user/${username}/virtualClusters`,
        data: {
          virtualClusters: virtualCluster,
        },
        type: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
          if (data.error) {
            showMessageBox(data.message);
          } else {
            showMessageBox({
              text: 'Update user information successfully',
              dismissedCallback: () => {
                $('#userEditModal').modal('hide');
                setAllUsers([]);
                refreshAllUsers();
              },
            });
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-update-virtual-cluster').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          showMessageBox(res.message);
        },
      });
    });
  };

  const updateUserAccount = (username) => {
    const password = $('#form-update-account :input[name=password]').val();
    const admin = $('#form-update-account :input[name=admin]').is(':checked') ? true : false;
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user`,
        data: {
          username,
          password,
          admin: admin,
          modify: true,
        },
        type: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
          if (data.error) {
            showMessageBox(data.message);
          } else {
            showMessageBox({
              text: 'Update user basic information successfully',
              dismissedCallback: () => {
                $('#userEditModal').modal('hide');
                setAllUsers([]);
                refreshAllUsers();
              },
            });
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-update-account').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          showMessageBox(res.message);
        },
      });
    });
  };

  const updateUserGithubPAT = (username) => {
    const githubPAT = $('#form-update-github-token :input[name=githubPAT]').val();
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user/${username}/githubPAT`,
        data: {
          githubPAT: githubPAT,
        },
        type: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
          if (data.error) {
            showMessageBox(data.message);
          } else {
            showMessageBox({
              text: 'Update user information successfully',
              dismissedCallback: () => {
                $('#userEditModal').modal('hide');
                setAllUsers([]);
                refreshAllUsers();
              },
            });
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-update-github-token').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          showMessageBox(res.message);
        },
      });
    });
  };

  window.updateUserVc = updateUserVc;
  window.updateUserAccount = updateUserAccount;
  window.updateUserGithubPAT = updateUserGithubPAT;

  const context = {
    allUsers,
    refreshAllUsers,
    filteredUsers,
    ordering,
    setOrdering,
    filter,
    setFilter,
    pagination,
    setPagination,
    setSelectedUsers,
    getSelectedUsers,
    setAllSelected,
    addUser,
    importCSV,
    removeUsers,
    editUser,
  };

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack verticalFill styles={{root: {position: 'relative'}}}>
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item grow styles={{root: {height: 1, overflow: 'auto', backgroundColor: 'white', paddingTop: 15}}}>
            <Table />
          </Stack.Item>
          <Stack.Item>
            <Paginator />
          </Stack.Item>
        </Stack>
      </Fabric>
      {loading.show && <MaskSpinnerLoading label={loading.text} />}
      {messageBox.text && <MessageBox text={messageBox.text} onDismiss={hideMessageBox} confirm={messageBox.confirm} onOK={messageBox.okCallback} onCancel={messageBox.cancelCallback} />}
      <div id="modalPlaceHolder" />
    </Context.Provider>
  );
}
