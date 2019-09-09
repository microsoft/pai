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

import React, { useState, useEffect } from 'react';

import {
  Fabric,
  Stack,
  initializeIcons,
  getTheme,
} from 'office-ui-fabric-react';
import { isNil, countBy, findIndex } from 'lodash';

import t from '../../../components/tachyons.scss';

import Context from './Context';
import BackButton from '../components/Back';
import TopBar from './TopBar';
import Table from './Table';
import BottomBar from './BottomBar';
import MessageBox from '../components/MessageBox';
import { toBool, isFinished } from './utils';
import {
  getAllUsersRequest,
  getAllVcsRequest,
  createUserRequest,
} from '../conn';

import { MaskSpinnerLoading } from '../../../components/loading';
import { initTheme } from '../../../components/theme';

import { checkAdmin } from '../../user-auth/user-auth.component';

const csvParser = require('papaparse');
const stripBom = require('strip-bom-string');
const columnUsername = 'username';
const columnPassword = 'password';
const columnEmail = 'email';
const columnAdmin = 'admin';
const columnVC = 'virtual cluster';

initTheme();
initializeIcons();

export default function BatchRegister() {
  const [userInfos, setUserInfos] = useState([]);
  const [loading, setLoading] = useState({ show: false, text: '' });
  const [virtualClusters, setVirtualClusters] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const refreshAllVcs = () => {
    getAllVcsRequest().then(data => {
      setVirtualClusters(Object.keys(data).sort());
    });
  };
  useEffect(refreshAllVcs, []);

  const refreshAllUsers = () => {
    getAllUsersRequest().then(data => {
      setAllUsers(data.map(user => user.username));
    });
  };
  useEffect(refreshAllUsers, []);

  const downloadTemplate = () => {
    const csvString = csvParser.unparse([
      {
        [columnUsername]: 'student1',
        [columnPassword]: '111111',
        [columnEmail]: 'student1@outlook.com',
        [columnAdmin]: false,
        [columnVC]: 'default',
      },
    ]);
    const universalBOM = '\uFEFF';
    const filename = 'userinfo.csv';
    const file = new Blob([universalBOM + csvString], {
      type: 'text/csv;charset=utf-8',
    });
    if (window.navigator.msSaveOrOpenBlob) {
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      // Others
      const a = document.createElement('a');
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const checkCSVFormat = csvResult => {
    const fields = csvResult.meta.fields;
    if (fields.indexOf(columnUsername) === -1) {
      showMessageBox('Missing column of username in the CSV file!');
      return false;
    }
    if (fields.indexOf(columnPassword) === -1) {
      showMessageBox('Missing column of password in the CSV file!');
      return false;
    }
    if (csvResult.errors.length > 0) {
      showMessageBox(
        `Row ${csvResult.errors[0].row + 2}: ${csvResult.errors[0].message}`,
      );
      return false;
    }
    if (csvResult.data.length === 0) {
      showMessageBox('Empty CSV file');
      return false;
    }
    return true;
  };

  const checkVCField = csvResult => {
    for (let i = 0; i < csvResult.data.length; i++) {
      const user = csvResult.data[i];
      if (user[columnVC]) {
        const parsedVCs = user[columnVC].split(',').map(vc => vc.trim());
        for (let j = 0; j < parsedVCs.length; j++) {
          const vc = parsedVCs[j];
          if (vc) {
            if (virtualClusters.indexOf(vc) === -1) {
              showMessageBox(`${vc} is not a valid virtual cluster name`);
              return false;
            }
          }
        }
        user.vcs = parsedVCs;
      } else {
        user.vcs = [];
      }
    }
    return true;
  };

  const parseUserInfosFromCSV = csvContent => {
    if (!csvContent) {
      showMessageBox('Empty CSV file');
      hideLoading();
      return;
    }
    const csvResult = csvParser.parse(stripBom(csvContent), {
      header: true,
      skipEmptyLines: true,
    });
    if (!checkCSVFormat(csvResult)) {
      hideLoading();
      return;
    }
    if (!checkVCField(csvResult)) {
      hideLoading();
      return;
    }
    if (csvResult.data) {
      setUserInfos([]);
      setUserInfos(csvResult.data);
    }
    hideLoading();
  };

  const importFromCSV = () => {
    const readFile = function(e) {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      showLoading('Uploading...');
      const reader = new FileReader();
      reader.onload = function(e) {
        parseUserInfosFromCSV(e.target.result);
        document.body.removeChild(fileInput);
      };
      reader.onerror = function(e) {
        hideLoading();
        showMessageBox('File could not be read.');
      };
      reader.readAsText(file);
    };
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.onchange = readFile;
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const submit = async () => {
    showLoading('Processing...');
    for (let i = 0; i < userInfos.length; i++) {
      const userInfo = userInfos[i];

      if (isFinished(userInfo)) {
        continue;
      }

      const successResult = {
        isSuccess: true,
        message: `User ${userInfo[columnUsername]} created successfully`,
      };

      const result = await createUserRequest(
        userInfo[columnUsername],
        userInfo[columnEmail],
        userInfo[columnPassword],
        toBool(userInfo[columnAdmin]),
        userInfo.vcs,
      )
        .then(() => {
          return successResult;
        })
        .catch(err => {
          return {
            isSuccess: false,
            message: `User ${userInfo[columnUsername]} created failed: ${String(
              err,
            )}`,
          };
        });

      userInfo.status = result;
      setUserInfos(userInfos.slice());
    }

    refreshAllUsers();
    refreshAllVcs();
    hideLoading();
    setTimeout(() => {
      const finishedStatus = countBy(userInfos, 'status.isSuccess');
      if (finishedStatus.false) {
        showMessageBox(
          `Create users finished with ${finishedStatus.false} failed.`,
        );
      } else {
        showMessageBox('Create users finished.');
      }
    }, 100);
  };

  const addNew = () => {
    userInfos.push({ vcs: [] });
    setUserInfos(userInfos.slice());
  };

  const removeRow = userInfo => {
    const newUserInfos = userInfos.slice();
    newUserInfos.splice(newUserInfos.indexOf(userInfo), 1);
    setUserInfos(newUserInfos);
  };

  const context = {
    downloadTemplate,
    importFromCSV,
    addNew,
    removeRow,
    userInfos,
    virtualClusters,
    allUsers,
    submit,
  };

  const showLoading = text => {
    setLoading({ show: true, text: text });
  };

  const hideLoading = () => {
    setLoading({ show: false });
  };

  const [messageBox, setMessageBox] = useState({
    text: '',
    confirm: false,
    onClose: null,
  });
  const showMessageBox = value => {
    return new Promise((resolve, reject) => {
      setMessageBox({ text: String(value), onClose: resolve });
    });
  };
  const hideMessageBox = value => {
    const { onClose } = messageBox;
    setMessageBox({ text: '' });
    if (onClose) {
      onClose(value);
    }
  };

  useEffect(() => {
    if (!checkAdmin()) {
      showMessageBox('Non-admin is not allowed to do this operation.').then(
        () => {
          window.location.href = '/';
        },
      );
    }
  }, []);

  const hideSubmit =
    findIndex(userInfos, userInfo => {
      return isNil(userInfo.status) || userInfo.status.isSuccess === false;
    }) === -1;

  const { spacing } = getTheme();

  return (
    <Context.Provider value={context}>
      <Fabric className={t.h100}>
        <Stack
          verticalFill
          styles={{
            root: [
              t.relative,
              { padding: `${spacing.s1} ${spacing.l1} ${spacing.l1}` },
            ],
          }}
          gap={spacing.s2}
        >
          <Stack.Item>
            <BackButton />
          </Stack.Item>
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item
            grow
            styles={{
              root: [
                t.overflowAuto,
                t.bgWhite,
                { height: 0, padding: spacing.l1 },
              ],
            }}
          >
            <Table />
          </Stack.Item>
          <Stack.Item>{!hideSubmit ? <BottomBar /> : null}</Stack.Item>
        </Stack>
      </Fabric>
      {loading.show && <MaskSpinnerLoading label={loading.text} />}
      {messageBox.text && (
        <MessageBox
          text={messageBox.text}
          onDismiss={hideMessageBox}
          confirm={messageBox.confirm}
        />
      )}
    </Context.Provider>
  );
}
