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

import React, {useState} from 'react';

import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {Stack} from 'office-ui-fabric-react/lib/Stack';
import {countBy} from 'lodash';

import Context from './context';
import BackButton from '../components/back';
import TopBar from './topBar';
import Table from './table';
import BottomBar from './bottomBar';
import {toBool} from './utils';

import Loading from '../components/loading';

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
  userAuth.checkToken(() => { });

  const [userInfos, setUserInfos] = useState([]);
  const [loading, setLoading] = useState({'show': false, 'text': ''});
  const [hideSubmit, setHideSubmit] = useState(false);

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

  const parseUserInfosFromCSV = (csvContent) => {
    if (!csvContent) {
      alert('Empty CSV file');
      return null;
    }
    let csvResult = csvParser.parse(stripBom(csvContent), {
      header: true,
      skipEmptyLines: true,
    });
    let fields = csvResult.meta.fields;
    if (fields.indexOf(columnUsername) === -1) {
      alert('Missing column of username in the CSV file!');
      return null;
    }
    if (fields.indexOf(columnPassword) === -1) {
      alert('Missing column of password in the CSV file!');
      return null;
    }
    if (csvResult.errors.length > 0) {
      alert(`Row ${csvResult.errors[0].row + 2}: ${csvResult.errors[0].message}`);
      return null;
    }
    if (csvResult.data.length == 0) {
      alert('Empty CSV file');
      return null;
    }
    return csvResult.data;
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
        let csvResult = parseUserInfosFromCSV(e.target.result);
        if (csvResult) {
          setUserInfos(csvResult);
          setHideSubmit(false);
        }
        document.body.removeChild(fileInput);
        hideLoading();
      };
      reader.onerror = function(e) {
        hideLoading();
        alert('File could not be read.');
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
          let reqs = [];
          if (githubPAT) {
            let req = $.ajax({
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
            reqs.push(req);
          }
          // Admin user VC update will be executed in rest-server
          if (!toBool(admin) && vc) {
            let req = $.ajax({
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
            reqs.push(req);
          }
          $.when(...reqs).then(
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
                message: `User ${username} created successfully but failed when update other info: ${res.message}`,
              });
            }
          );
        },
        error: (xhr, textStatus, error) => {
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
      hideLoading();
      setTimeout(() => {
        const finishedStatus = countBy(userInfos, 'status.isSuccess');
        if (finishedStatus.false) {
          alert(`Create users finished with ${finishedStatus.false} failed.`);
        } else {
          alert('Create users finished.');
        }
      }, 100);
    } else {
      let userInfo = userInfos[index];
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
  };

  const submit = () => {
    if (!userAuth.checkAdmin()) {
      alert('Non-admin is not allowed to do this operation.');
      return;
    }
    setHideSubmit(true);
    addUserRecursively(0);
  };

  const context = {
    downloadTemplate,
    importFromCSV,
    userInfos,
    submit,
  };

  const showLoading = (text) => {
    setLoading({'show': true, 'text': text});
  };

  const hideLoading = () => {
    setLoading({'show': false});
  };

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
          <Stack.Item>
            <div style={{padding: '1rem', backgroundColor: 'white'}}>
              <Table />
            </div>
          </Stack.Item>
          <Stack.Item>
            {userInfos.length > 0 && !hideSubmit ? <BottomBar /> : null}
          </Stack.Item>
        </Stack>
      </Fabric>
      {loading.show && <Loading label={loading.text} />}
    </Context.Provider>
  );
}
