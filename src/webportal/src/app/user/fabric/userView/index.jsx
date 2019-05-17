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

import {Fabric, Stack, initializeIcons, Modal, getTheme} from 'office-ui-fabric-react';
import {debounce} from 'lodash';

import {MaskSpinnerLoading} from '../../../components/loading';
import {initTheme} from '../../../components/theme';
import MessageBox from '../components/MessageBox';

import t from '../../../components/tachyons.scss';

import Context from './Context';
import TopBar from './TopBar';
import Table from './Table';
import Ordering from './Ordering';
import Filter from './Filter';
import Pagination from './Pagination';
import Paginator from './Paginator';
import InfoEditor from './InfoEditor';
import {getAllUsersRequest, removeUserRequest, updateUserVcRequest, updateUserRequest} from '../conn';

require('./user-edit-modal-component.scss');

initTheme();
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
    } else if (!value.hasOwnProperty('text')) {
      setMessageBox({text: String(value)});
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
    setAllUsers([]);
    getAllUsersRequest().then((data) => {
      setAllUsers(data);
    }).catch((err) => {
      showMessageBox({
        text: String(err),
        dismissedCallback: () => {
          window.location.href = '/';
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

  const removeUsers = () => {
    const selected = getSelectedUsers();
    showMessageBox({
      text: `Are you sure to remove ${selected.length == 1 ? 'the user' : 'these users'}?`,
      confirm: true,
      okCallback: () => {
        showLoading('Processing...');
        Promise.all(selected.map((user) => removeUserRequest(user.username).catch((err) => err)))
          .then((results) => {
            hideLoading();
            const errors = results.filter((result) => result instanceof Error);
            let message = `Remove ${selected.length == 1 ? 'user' : 'users'} `;
            if (errors.length == 0) {
              message += 'successfully.';
            } else {
              message += `with ${errors.length} failed.`;
              errors.forEach((error) => {
                message += `\n${String(error)}`;
              });
            }
            setTimeout(() => {
              showMessageBox({
                text: message,
                dismissedCallback: () => {
                  refreshAllUsers();
                },
              });
            }, 100);
          });
      },
    });
  };

  const [showEditInfo, setShowEditInfo] = useState({isOpen: false, user: {}});

  const editUser = (user) => {
    setShowEditInfo({isOpen: true, user});
  };

  const hideEditUser = () => {
    setShowEditInfo({isOpen: false, user: {}});
  };

  const updateUserInfoCallback = (data) => {
    if (data.error) {
      showMessageBox(data.message);
    } else {
      showMessageBox({
        text: 'Update user information successfully',
        dismissedCallback: () => {
          hideEditUser();
          refreshAllUsers();
        },
      });
    }
  };

  const updateUserVC = (username, virtualCluster) => {
    updateUserVcRequest(username, virtualCluster)
      .then(updateUserInfoCallback)
      .catch(showMessageBox);
  };

  const updateUserAccount = (username, password, admin) => {
    updateUserRequest(username, password, admin)
      .then(updateUserInfoCallback)
      .catch(showMessageBox);
  };

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

  const {spacing} = getTheme();

  return (
    <Context.Provider value={context}>
      <Fabric className={t.h100}>
        <Stack verticalFill styles={{root: [t.relative]}}>
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item grow styles={{root: [t.overflowAuto, t.bgWhite, {paddingTop: spacing.m}]}}>
            <Table />
          </Stack.Item>
          <Stack.Item>
            <Paginator />
          </Stack.Item>
        </Stack>
      </Fabric>
      <Modal
        isOpen={showEditInfo.isOpen}
        styles={{main: [{maxWidth: '600px'}, t.w90]}}>
        {showEditInfo.isOpen &&
          <InfoEditor
            user={showEditInfo.user}
            updateUserAccount={updateUserAccount}
            updateUserVC={updateUserVC}
            hideEditUser={hideEditUser} />}
      </Modal>
      {loading.show && <MaskSpinnerLoading label={loading.text} />}
      {messageBox.text && <MessageBox text={messageBox.text} onDismiss={hideMessageBox} confirm={messageBox.confirm} onOK={messageBox.okCallback} onCancel={messageBox.cancelCallback} />}
    </Context.Provider>
  );
}
