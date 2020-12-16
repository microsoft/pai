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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import {ComboBox} from 'office-ui-fabric-react/lib';
import React, {useState, useEffect} from 'react';
import {
    Stack,
    StackItem,
    TextField,
    PrimaryButton,
    ActionButton,
    CommandBar,
    Text,
    Spinner,
    SpinnerSize,
    concatStyleSets,
} from 'office-ui-fabric-react';
import {isEmpty, endsWith, trimStart, trimEnd} from 'lodash';
import {fetchContainerLog, downloadContainerLogToFile, getReplacedEscapeString, getReplacedErrorMessageTagString, addCommas} from './conn';

// It's the centralized log viewer for Spark/Launcher job
const LogViewer = () => {
  const [downloadingData, setDownloadingData] = useState(true);
  const [filePageNumberDict, setFilePageNumberDict] = useState({});
  const [filePageContentCacheDict, setFilePageContentCacheDict] = useState({});
  const [selectedLogInfo, setSelectedLogInfo] = useState([]);
  const [errorWithNoLogsInfo, setErrorWithNoLogsInfo] = useState('');
  const [allLogInfoPreview, setAllLogInfoPreview] = useState([]);
  const [fileLogs, setFileLogs] = useState({key: 'All', text: 'All'});
  const [selectedBatchSize, setSelectedBatchSize] = useState({key: '1Mb', size: 1024 * 1024, text: '1Mb', maxCachePages: 32});
  let iTime = null;

  useEffect(() => {
    Promise.all([
      initGetLogsSetting('-1048576', undefined, false, 'all')
    ]).catch((err) => {
      alert(err);
    });
  }, []);

  // Download the full log file, which the max file size is determined from Rest API.
  async function downloadLogToFile() {
    setDownloadingData(true);
    await fetchContainerLog(0, undefined, true, fileLogs.key);
    setDownloadingData(false);
  }

  async function downloadContainerLogFile() {
    setDownloadingData(true);
    try {
      let downloadUri = await downloadContainerLogToFile(fileLogs.key);
      const trimStartDownloadUri = trimStart(downloadUri, '\"');
      const trimEndDownloadUri = trimEnd(trimStartDownloadUri, '\"');
      location.href = trimEndDownloadUri;
    } catch (err) {
      alert(err);
    }
    setDownloadingData(false);
  }

  const initGetLogsSetting = async (start, end, isSaveToFile, logFileName, filePageNumber) => {
    setDownloadingData(true);
    try {
      const allLogInfoPreview = await fetchContainerLog(start, end, isSaveToFile, logFileName);
      if (Array.isArray(allLogInfoPreview)) {
        setAllLogInfoPreview(allLogInfoPreview);
      } else if (typeof allLogInfoPreview === 'string') {
        setErrorWithNoLogsInfo(allLogInfoPreview);
      }
      setDownloadingData(false);
    } catch (err) {
      alert(err);
    }
  };

  async function generalGetLogsSetting(start, end, isSaveToFile, logFileName, filePageNumber) {
    setDownloadingData(true);
    let contentCacheDict = filePageContentCacheDict;
    let numberDict = filePageNumberDict;
    let selectedInfo = {};
    try {
      selectedInfo = await fetchContainerLog(start, end, isSaveToFile, logFileName);
    } catch (err) {
      alert(err);
    }
    if (filePageNumber === 'initPage') {
      contentCacheDict = {1: selectedInfo[0]};
      numberDict[logFileName] = 1;
    } else {
      contentCacheDict[filePageNumber] = selectedInfo[0];
      numberDict[logFileName] = filePageNumber;
    }

    if (Object.keys(contentCacheDict).length > selectedBatchSize.maxCachePages ) {
      contentCacheDict = {};
    }

    setFilePageContentCacheDict(contentCacheDict);
    setFilePageNumberDict(numberDict);
    setSelectedLogInfo(selectedInfo[0]);
    setDownloadingData(false);
  }


  // Batch mode to fetch the previous batch log
  function onClickFetchPreviousBatchContainerLog() {
    if (selectedLogInfo === undefined || selectedLogInfo.end === undefined) {
      return;
    }

    let numberDict = filePageNumberDict;
    let pageNumber = numberDict[fileLogs.key];
    numberDict[fileLogs.key] = pageNumber - 1;
    if (filePageContentCacheDict.hasOwnProperty(pageNumber - 1)) {
      setFilePageNumberDict(numberDict);
      setSelectedLogInfo(filePageContentCacheDict[pageNumber - 1]);
    } else {
      let batchSize = selectedBatchSize.size;
      let start = parseInt(selectedLogInfo.start) + batchSize;
      let end = parseInt(selectedLogInfo.end) + batchSize >= 0 ? undefined : parseInt(selectedLogInfo.end) + batchSize;
      generalGetLogsSetting(start, end, false, fileLogs.key, pageNumber - 1);
    }
  }

  // Batch mode to fetch the next batch log
  function onClickFetchNextBatchContainerLog() {
    if (selectedLogInfo === undefined) {
      return;
    }
    let numberDict = filePageNumberDict;
    let pageNumber = numberDict[fileLogs.key];
    numberDict[fileLogs.key] = pageNumber + 1;
    if (filePageContentCacheDict.hasOwnProperty(pageNumber + 1)) {
      setFilePageNumberDict(numberDict);
      setSelectedLogInfo(filePageContentCacheDict[pageNumber + 1]);
    } else {
      let start = selectedLogInfo.start - selectedBatchSize.size;
      let end = selectedLogInfo.start;
      fetchContainerLog(start, end, false, fileLogs.key);
      generalGetLogsSetting(start, selectedLogInfo.start, false, fileLogs.key, pageNumber + 1);
    }
  }

  // Batch mode to fetch the search batch log
  function onClickFetchSearchBatchContainerLog(e, value) {
    let selectIndex = value * 1;
    const totalNumber = parseInt(calPageNumber().totalNumber);
    if (selectIndex <= 1 || isNaN(selectIndex)) {
      selectIndex = 1;
    } else if (selectIndex >= totalNumber ) {
      selectIndex = totalNumber;
    }

    let goToPageNumber = parseInt(selectIndex);
    let batchSize = parseInt(selectedBatchSize.size);
    let newStart = - batchSize * goToPageNumber;
    let newEnd = goToPageNumber === 1 ? undefined : - batchSize * (goToPageNumber - 1);
    generalGetLogsSetting(newStart, newEnd, false, fileLogs.key, goToPageNumber);
  }

  // Refresh logs data, no re render page.
  function refreshLogs() {
    setFileLogs({key: 'All', text: 'All'});
    setFilePageNumberDict({});
    setFilePageContentCacheDict({});
    setSelectedBatchSize({key: '1Mb', size: 1024 * 1024, text: '1MB', maxCachePages: 32});
    initGetLogsSetting('-1048576', undefined, false, 'all');
  }

  // Disable the button of fetching previous batch if there is no previous batch.
  function disablePreviousStatus() {
    const currentNumber = parseInt(calPageNumber().currentNumber);
    if (currentNumber === 1) {
      return true;
    }
    return false;
  }

  // Disable the button of fetching next batch if there is no next batch.
  function disableNextStatus() {
    const currentNumber = parseInt(calPageNumber().currentNumber);
    const totalNumber = parseInt(calPageNumber().totalNumber);
    if (currentNumber === totalNumber) {
      return true;
    }
    return false;
  }

  // Disable the download button if it's not selected the specific log file. We can only downlaod one file for one time.
  function disableDownloadStatus() {
    if (selectedLogInfo && selectedLogInfo.content === '') {
      return true;
    }
    return false;
  }

  function onChangeLogCombobox(e, log) {
    setFileLogs(log);
    if (log.key === 'All') {
      setFilePageNumberDict({});
      setFilePageContentCacheDict({});
      setSelectedBatchSize({key: '1Mb', size: 1024 * 1024, text: '1MB', maxCachePages: 32});
      return;
    }
    generalGetLogsSetting(0 - selectedBatchSize.size, undefined, false, log.key, 'initPage');
  }

  function onChangeBatchSizeCombobox(e, batchSize) {
    setSelectedBatchSize(batchSize);
    if (!isEmpty(errorWithNoLogsInfo)) {
      return;
    }
    generalGetLogsSetting(0 - batchSize.size, undefined, false, fileLogs.key, 'initPage');
  }

  function calPageNumber() {
    let totalNumber = selectedLogInfo.fileLength === '0' ? 1 : Math.ceil(selectedLogInfo.fileLength / selectedBatchSize.size);
    let currentNumber = filePageNumberDict[fileLogs.key];
    currentNumber = currentNumber === undefined ? 1 : currentNumber;
    return {
      currentNumber: currentNumber.toString(),
      totalNumber: totalNumber.toString(),
    };
  }

  function getHeaderTitle() {
    return {
      key: 'viewer',
      name: 'LogViewer',
      text: 'LogViewer',
      buttonStyles: {root: {height: '100%'}},
      iconProps: {
        iconName: 'BacklogList',
      },
    };
  }

  function getRefresh() {
    return {
      key: 'Refresh',
      name: 'Refresh',
      text: 'Refresh',
      buttonStyles: {root: {height: '100%'}},
      iconProps: {
        iconName: 'Refresh',
      },
      disabled: downloadingData,
      onClick: refreshLogs,
    };
  }

  const headerTitleItems = [getHeaderTitle()];
  const refreshItems = [getRefresh()];
  const ComboBoxCustomStyledExampleStyles = {
    container: {
      display: 'flex',
    },
    label: {
        paddingTop: 10,
    },
    root: {
      width: 250,
      marginLeft: 5,
    },
  };
  const searchStyles = {
    fieldGroup: {
      width: 60,
      borderRadius: 2,
    },
  };

  function getFileLogsOption() {
    let fileLog = [{key: 'All', text: 'All'}];
    if (!isEmpty(allLogInfoPreview) && Array.isArray(allLogInfoPreview)) {
      allLogInfoPreview.map((log, index) => {
        fileLog.push({key: log.fileName, text: log.fileName});
      });
      return fileLog;
    } else {
      return fileLog;
    }
  }

  const isContainerDumpLog = (fileName) => {
    const flag = endsWith(fileName, '.zip') || endsWith(fileName, '.hprof');
    return flag;
  };

  const batchSizeListOption = () => {
    const basicSize = 1024;
    return [
      {key: '1Mb', size: basicSize * 1024, text: '1MB', maxCachePages: 32},
      {key: '2Mb', size: basicSize * 1024 * 2, text: '2MB', maxCachePages: 16},
      {key: '4Mb', size: basicSize * 1024 * 4, text: '4MB', maxCachePages: 8},
      {key: '8Mb', size: basicSize * 1024 * 8, text: '8MB', maxCachePages: 4},
      {key: '16Mb', size: basicSize * 1024 * 16, text: '16MB', maxCachePages: 2},
      {key: '32Mb', size: basicSize * 1024 * 32, text: '32MB', maxCachePages: 1},
    ];
  };

  return (
    <Stack styles={{root: {width: '100%', height: '100%'}}}>
      <CommandBar
        items={headerTitleItems}
        farItems={refreshItems}
        styles={{root: {padding: 0, width: '100%'}}}
      />
      <Stack grow={1} shrink={1} styles={{root: {overflow: 'auto', position: 'relative'}}}>
        {downloadingData &&
          <Spinner
            size={SpinnerSize.large}
            ariaLive="assertive"
            className={c(t.absolute, t.absoluteFill)}
            styles={{root: {zIndex: 20, backgroundColor: 'rgba(255, 255, 255, .7)'}}}
          />
        }
        <Stack horizontal horizontalAlign='space-between'>
          <Stack horizontal tokens={{childrenGap: 5, padding: 20}}>
            <ComboBox
              label='LogFiles: '
              options={getFileLogsOption()}
              selectedKey={fileLogs.key}
              styles={ComboBoxCustomStyledExampleStyles}
              onItemClick={onChangeLogCombobox}
              className={c(t.pa3)}
              />
          </Stack>
          {
            fileLogs.key !== 'All' && !isContainerDumpLog(fileLogs.key) &&
            <Stack horizontal tokens={{childrenGap: 5, padding: 20}} className={c(t.pa3)}>
              <ComboBox
                label='PageSize: '
                options={batchSizeListOption()}
                selectedKey={selectedBatchSize.key}
                styles={concatStyleSets(ComboBoxCustomStyledExampleStyles, {container: {width: 160}})}
                onItemClick={onChangeBatchSizeCombobox}
                />
              <Text styles={{root: {marginTop: 10, color: 'rgb(194, 194, 194)', width: 35}}}>
                Go to
              </Text>
              <ActionButton
                style={{root: {backgroundColor: 'transparent'}}}
                iconProps={{iconName: 'ChevronLeft'}}
                disabled={disablePreviousStatus()}
                onClick={() => onClickFetchPreviousBatchContainerLog()}
                />
              <TextField
                styles={searchStyles}
                onChange={(e, value) => {
                  clearTimeout(iTime);
                  iTime = setTimeout(() => {
                    onClickFetchSearchBatchContainerLog(e, value);
                  }, 1500);
                }}
                disabled={downloadingData}
                value={filePageNumberDict[fileLogs.key]}
              />
              <Text styles={{root: {marginTop: 10, color: 'rgb(194, 194, 194)'}}}>
                {'/' + calPageNumber().totalNumber}
              </Text>
              <ActionButton
                style={{root: {backgroundColor: 'transparent'} }}
                iconProps= {{iconName: 'ChevronRight'}}
                disabled={disableNextStatus()}
                onClick={() => onClickFetchNextBatchContainerLog()}
                />
            </Stack>
          }
        </Stack>
        <Stack grow={1} shrink={1} styles={{root: {overflowY: 'auto', overflowX: 'hidden'}}} tokens={{childrenGap: 5}}>
          {
            fileLogs.key === 'All' && !isEmpty(errorWithNoLogsInfo) && (
              <Stack className={c(t.pa3)}>
                <StackItem className={c(t.pv1)}>Get Logs Error</StackItem>
                <StackItem className={c(t.pv1)}>Error Message:</StackItem>
                <StackItem className={c(t.pv1)}>{getReplacedErrorMessageTagString(errorWithNoLogsInfo)}</StackItem>
              </Stack>
            )
          }
          {
            fileLogs.key === 'All' && isEmpty(errorWithNoLogsInfo) && (
              allLogInfoPreview.map((log, index) => (
                <Stack className={c(t.pa3)} key={index}>
                  <StackItem className={c(t.pv1)}>{'LogFile: ' + log.fileName}</StackItem>
                  <StackItem className={c(t.pv1)}>{'Total file length: ' + addCommas(log.fileLength) + ' B'}</StackItem>
                </Stack>
              ))
            )
          }
          {
            fileLogs.key !== 'All' && !isEmpty(selectedLogInfo) && (
              <Stack grow={1} shrink={1} className={c(t.pa3)}>
                <StackItem className={c(t.pv1)}>{'LogFile: ' + selectedLogInfo.fileName}</StackItem>
                <StackItem className={c(t.pv1)}>{'Total file length: ' + addCommas(selectedLogInfo.fileLength) + ' B'}</StackItem>
                {isContainerDumpLog(fileLogs.key) && 
                  <StackItem className={c(t.pv1)}>
                    The heap dump file is in binary format, please download and analyze it using tools like jhat or JVisualVM.
                  </StackItem>
                }
                {!isContainerDumpLog(fileLogs.key) && 
                  <StackItem className={c(t.pv1)}>{'Offset-Start: ' + selectedLogInfo.start}</StackItem>
                }
                {!isContainerDumpLog(fileLogs.key) && (
                  <StackItem grow={1} shrink={1}>
                    <StackItem className={c(t.pv1)}>LogContent: </StackItem>
                    <TextField multiline underlined readOnly autoAdjustHeight resizable={false}
                      className={c(t.flexGrow1)}
                      styles={{
                        root: {'width': '100%', 'height': '100%', 'overflowY': 'auto', 'white-space': 'pre-wrap'},
                        wrapper: {height: '100%'},
                        fieldGroup: {overflowY: 'auto'},
                        field: {overflowY: 'auto', height: '100%!important'}
                      }}
                      disabled={downloadingData}
                      value={selectedLogInfo.content === '' ? 'No logs here' : getReplacedEscapeString(selectedLogInfo.content)}
                    />
                  </StackItem>
                )}
              </Stack>
            )
          }
        </Stack>
        <Stack horizontal horizontalAlign='space-evenly' className={c(t.pv4)}>
          {fileLogs.key !== 'All' && !isContainerDumpLog(fileLogs.key) && (<StackItem>
            <PrimaryButton disabled={disableDownloadStatus()} onClick={() => downloadLogToFile()} text='Download Latest 100MB' letiant='large' />
          </StackItem>)}
          {fileLogs.key !== 'All' && isContainerDumpLog(fileLogs.key) && (<StackItem>
            <PrimaryButton disabled={disableDownloadStatus()} onClick={() => downloadContainerLogFile()} text='Download Heap Dump Log' letiant='large' />
          </StackItem>)}
        </Stack>
      </Stack>
    </Stack>
  );
};

LogViewer.propTypes = {};

export default LogViewer;
