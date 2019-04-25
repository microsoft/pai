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

import React, {useState, useEffect} from 'react';

import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric, Stack} from 'office-ui-fabric-react';
import {countBy, findIndex} from 'lodash';

import Context from './Context';
import BackButton from '../components/Back';
import TopBar from './TopBar';
import Table from './Table';
import BottomBar from './BottomBar';
import MessageBox from '../components/MessageBox';
import {toBool, isFinished} from './utils';

import Loading from '../components/Loading';

import webportalConfig from '../../../config/webportal.config';
import userAuth from '../../user-auth/user-auth.component';

const csvParser = require('papaparse');
const stripBom = require('strip-bom-string');
const columnUsername = 'username';
const columnPassword = 'password';
const columnAdmin = 'admin';
const columnVC = 'virtual cluster';
const columnGithubPAT = 'githubPAT';

initializeIcons();

export default function BatchRegister() {
  const [userInfos, setUserInfos] = useState([]);
  const [loading, setLoading] = useState({'show': false, 'text': ''});
  const [virtualClusters, setVirtualClusters] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const refreshAllVcs = () => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters`,
      type: 'GET',
      dataType: 'json',
      success: (data) => {
        setVirtualClusters(Object.keys(data).sort());
      },
    });
  };
  useEffect(refreshAllVcs, []);

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
          setAllUsers(data.map((user) => user.username));
        },
      });
    });
  };
  useEffect(refreshAllUsers, []);

  const downloadTemplate = () => {
    let csvString = csvParser.unparse([{
      [columnUsername]: 'student1',
      [columnPassword]: '111111',
      [columnAdmin]: false,
      [columnVC]: 'default',
      [columnGithubPAT]: '',
    }]);
    let universalBOM = '\uFEFF';
    let filename = 'userinfo.csv';
    let file = new Blob([universalBOM + csvString], {type: 'text/csv;charset=utf-8'});
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
      let a = document.createElement('a');
      let url = URL.createObjectURL(file);
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

  const checkCSVFormat = (csvResult) => {
    let fields = csvResult.meta.fields;
    if (fields.indexOf(columnUsername) === -1) {
      showMessageBox('Missing column of username in the CSV file!');
      return false;
    }
    if (fields.indexOf(columnPassword) === -1) {
      showMessageBox('Missing column of password in the CSV file!');
      return false;
    }
    if (csvResult.errors.length > 0) {
      showMessageBox(`Row ${csvResult.errors[0].row + 2}: ${csvResult.errors[0].message}`);
      return false;
    }
    if (csvResult.data.length == 0) {
      showMessageBox('Empty CSV file');
      return false;
    }
    return true;
  };

  const checkVCField = (csvResult) => {
    for (let i = 0; i < csvResult.data.length; i++) {
      let user = csvResult.data[i];
      if (user[columnVC]) {
        const parsedVCs = user[columnVC].split(',').map((vc) => vc.trim());
        for (let j = 0; j < parsedVCs.length; j++) {
          let vc = parsedVCs[j];
          if (vc) {
            if (virtualClusters.indexOf(vc) == -1) {
              showMessageBox(`${vc} is not a valid virtual cluster name`);
              return false;
            }
          }
        }
      }
    }
    return true;
  };

  const parseUserInfosFromCSV = (csvContent) => {
    if (!csvContent) {
      showMessageBox('Empty CSV file');
      hideLoading();
      return;
    }
    let csvResult = csvParser.parse(stripBom(csvContent), {
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
    let readFile = function(e) {
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      showLoading('Uploading...');
      let reader = new FileReader();
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
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.onchange = readFile;
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const addUser = (username, password, admin, vc, githubPAT) => {
    let deferredObject = new $.Deferred();
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user`,
        data: {
          username,
          password,
          admin: toBool(admin),
          modify: false,
        },
        type: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: () => {
          let githubPATReq = null;
          if (githubPAT) {
            githubPATReq = $.ajax({
              url: `${webportalConfig.restServerUri}/api/v1/user/${username}/githubPAT`,
              data: {
                githubPAT: githubPAT,
              },
              type: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              dataType: 'json',
            });
          }
          $.when(githubPATReq).then(
            () => {
              let vcReq = null;
              // Admin user VC update will be executed in rest-server
              if (!toBool(admin) && vc) {
                vcReq = $.ajax({
                  url: `${webportalConfig.restServerUri}/api/v1/user/${username}/virtualClusters`,
                  data: {
                    virtualClusters: vc,
                  },
                  type: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  dataType: 'json',
                });
              }
              $.when(vcReq).then(
                () => {
                  deferredObject.resolve({
                    isSuccess: true,
                    message: `User ${username} created successfully`,
                  });
                },
                (xhr) => {
                  const res = JSON.parse(xhr.responseText);
                  deferredObject.resolve({
                    isSuccess: true,
                    message: `User ${username} created successfully but failed when update virtual clusters: ${res.message}`,
                  });
                }
              );
            },
            (xhr) => {
              const res = JSON.parse(xhr.responseText);
              deferredObject.resolve({
                isSuccess: true,
                message: `User ${username} created successfully but failed when update githubPAT: ${res.message}`,
              });
            }
          );
        },
        error: (xhr) => {
          const res = JSON.parse(xhr.responseText);
          deferredObject.resolve({
            isSuccess: false,
            message: `User ${username} created failed: ${res.message}`,
          });
        },
      });
    });
    return deferredObject.promise();
  };

  const addUserRecursively = (index) => {
    if (index == 0) {
      showLoading('Processing...');
    }
    if (index >= userInfos.length) {
      refreshAllUsers();
      refreshAllVcs();
      hideLoading();
      setTimeout(() => {
        const finishedStatus = countBy(userInfos, 'status.isSuccess');
        if (finishedStatus.false) {
          showMessageBox(`Create users finished with ${finishedStatus.false} failed.`);
        } else {
          showMessageBox('Create users finished.');
        }
      }, 100);
    } else {
      let userInfo = userInfos[index];
      if (isFinished(userInfo)) {
        addUserRecursively(++index);
      } else {
        addUser(userInfo[columnUsername],
          userInfo[columnPassword],
          userInfo[columnAdmin],
          userInfo[columnVC],
          userInfo[columnGithubPAT])
          .then((result) => {
            userInfo.status = result;
            setUserInfos(userInfos.slice());
            addUserRecursively(++index);
          });
      }
    }
  };

  const submit = () => {
    addUserRecursively(0);
  };

  const addNew = () => {
    userInfos.push({});
    setUserInfos(userInfos.slice());
  };

  const removeRow = (userInfo) => {
    let newUserInfos = userInfos.slice();
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

  useEffect(() => {
    userAuth.checkToken(() => {
      if (!userAuth.checkAdmin()) {
        showMessageBox({
          text: 'Non-admin is not allowed to do this operation.',
          dismissedCallback: () => {
            window.location.href = '/';
          },
        });
      }
    });
  }, []);

  const hideSubmit = findIndex(userInfos, (userInfo) => {
    return userInfo.status == undefined || userInfo.status.isSuccess == false;
  }) == -1;

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack verticalFill styles={{root: {position: 'relative', padding: '2rem'}}} gap='1rem'>
          <Stack.Item>
            <BackButton />
          </Stack.Item>
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item grow styles={{root: {overflow: 'auto', backgroundColor: 'white', padding: '1rem'}}}>
            <Table />
          </Stack.Item>
          <Stack.Item>
            {!hideSubmit ? <BottomBar /> : null}
          </Stack.Item>
        </Stack>
      </Fabric>
      {loading.show && <Loading label={loading.text} />}
      {messageBox.text && <MessageBox text={messageBox.text} onDismiss={hideMessageBox} confirm={messageBox.confirm} onOK={messageBox.okCallback} onCancel={messageBox.cancelCallback} />}
    </Context.Provider>
  );
}
