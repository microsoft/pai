'use strict';
const util = require('util');
const request = require('request');
const getPromise = util.promisify(request.get);
const deletePromise = util.promisify(request.delete);
const fetch = require('node-fetch');
const marketEnv = require('@pai/config/mp/env-mp');
const axios = require('@pai/utils/non-strict-axios');

let mpEnvDict = marketEnv.parseIni();

/**
 * read hdfs file content
 * @param {*} targetUrl
 */
async function readFileContentFromHdfsAsync(targetUrl) {
    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
        });
        return {
            status: 'succeeded',
            content: response.data,
        };
    } catch (error) {
        throw error;
    }
}

/**
 * read module metadata from File System(HDFS)
 * @param {*} alias
 * @param {*} moduleId
 * @param {*} callback
 */
async function readModuleDataFromFS(alias, moduleId, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requesInfoFiletURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['MODULE_DIR']}${moduleId}/_info?op=OPEN&user.name=${alias}`;
        let requesDetailFiletURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['MODULE_DIR']}${moduleId}/_detail?op=OPEN&user.name=${alias}`;
        try {
            let infoValue = await getPromise(requesInfoFiletURL);
            let detailValue = await getPromise(requesDetailFiletURL);
            let body = JSON.parse(detailValue.body);
            if (body.hasOwnProperty('RemoteException')) {
                if (infoValue.body.includes('does not exist') || detailValue.body.includes('does not exist')) {
                    callback(`module ${moduleId} does not exist!`, '');
                } else {
                    callback(body['RemoteException'], null);
                }
            } else {
                callback(null, {'info': infoValue.body, 'detail': detailValue.body});
            }
        } catch (err) {
            callback(err, null);
        }
    }
}

/**
 * read example metadata from File System (HDFS)
 * @param {*} alias the user's alias
 * @param {*} exampleId example file is named same with exampleId
 * @param {*} callback callback function
 */
async function readExampleDataFromFS(alias, exampleId, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requesDetailFiletURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['EXAMPLES_DIR']}${exampleId}?op=OPEN&user.name=${alias}`;
        try {
            let metadataValue = await getPromise(requesDetailFiletURL);
            let body = JSON.parse(metadataValue.body);
            if (body.hasOwnProperty('RemoteException')) {
                if (metadataValue.body.includes('does not exist')) {
                    callback(`example ${exampleId} does not exist!`, null);
                } else {
                    callback(body['RemoteException'], null);
                }
            } else {
                callback(null, metadataValue.body);
            }
        } catch (err) {
            callback(err, null);
        }
    }
}

/**
 * get metadata information of module, it is stored in '_detail' file
 * @param {*} alias
 * @param {*} moduleId
 * @param {*} callback
 */
async function readModuleMetadataFromFS(alias, moduleId, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requesDetailFiletURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['MODULE_DIR']}${moduleId}/_detail?op=OPEN&user.name=${alias}`;
        try {
            let metadataValue = await getPromise(requesDetailFiletURL);
            callback(null, metadataValue.body);
        } catch (err) {
            callback(err, null);
        }
    }
}

/**
 * delete file from filesystem (HDFS)
 * @param {*} alias
 * @param {*} filePath
 * @param {*} callback
 */
async function deleteFileFromFS(alias, filePath, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requestDeleteURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${filePath}?op=DELETE&user.name=${alias}&recursive=true`;
        try {
            let result = await deletePromise(requestDeleteURL);
            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    }
}

/**
 * create a new file in HDFS
 * @param {*} alias
 * @param {*} dir
 * @param {*} fileName
 * @param {*} content
 * @param {*} callback
 */
async function writeFileToFs(alias, dir, fileName, content, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requestURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${dir}${fileName}?op=CREATE&overwrite=true&user.name=${alias}`;
        const res = await fetch(
            `${requestURL}`,
            {
              method: 'put',
              redirect: 'manual',
            },
          );
        const location = res.url;
        fetch(location, {
            method: 'put',
            headers: {'Content-Type': 'application/octet-stream'},
            body: content,
        })
        .then(() => {
            callback('success');
        })
        .catch((err) => {
            callback(err);
        });
    }
}

/**
 * list module directory
 * @param {*} alias
 * @param {*} callback
 */
function listModuleDir(alias, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requestURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['MODULE_DIR']}?op=LISTSTATUS&user.name=${alias}`;
        getPromise(requestURL).then((value) => {
            callback({'info': value.body});
        }).catch((err) => {
            callback({'err': err});
        });
    }
}

/**
 * list example directory
 * @param {*} alias
 * @param {*} callback
 */
function listExampleDir(alias, callback) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requestURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${mpEnvDict['EXAMPLES_DIR']}?op=LISTSTATUS&user.name=${alias}`;
        getPromise(requestURL).then((value) => {
            callback({'info': value.body});
        }).catch((err) => {
            callback({'err': err});
        });
    }
}

/**
 * check path status in HDFS
 * @param {*} path
 */
async function checkPathStatus(path) {
    if (mpEnvDict['FILE_SYSTEM'] === 'HDFS') {
        let requestURL = `${mpEnvDict['MODULE_WEBHDFS_URI']}${path}?op=GETFILESTATUS`;
        return await getPromise(requestURL);
    }
}

exports.readModuleDataFromFS = readModuleDataFromFS;
exports.writeFileToFs = writeFileToFs;
exports.listModuleDir = listModuleDir;
exports.readModuleMetadataFromFS = readModuleMetadataFromFS;
exports.listExampleDir = listExampleDir;
exports.readExampleDataFromFS = readExampleDataFromFS;
exports.writeFileToFs = writeFileToFs;
exports.checkPathStatus = checkPathStatus;
exports.deleteFileFromFS = deleteFileFromFS;
exports.readFileContentFromHdfsAsync = readFileContentFromHdfsAsync;
