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
'use strict';

const LocalCache = require('@pai/utils/localCache');
const fsAdaptor = require('@pai/utils/mp-storage');
const util = require('util');
const marketEnv = require('@pai/config/mp/env-mp');
const getModuleMetadataPromise = util.promisify(fsAdaptor.readModuleMetadataFromFS);
const getExampleDataPromise = util.promisify(fsAdaptor.readExampleDataFromFS);

class HDFSCache {
    constructor() {
        this._localModuleCache = new LocalCache();
        this._localExampleCache = new LocalCache();
        let mpEnvDict = marketEnv.parseIni();
        this.hdfs_user = mpEnvDict['HDFS_USER'];
        setInterval(() => {
            this.updateAllModuleAndExampleCache(() => {});
        }, 20000);
    }

    /**
     * update example cache content by exampleId
     * @param {*} exampleId
     * @param {*} callback
     */
    updateExampleCache(exampleId, callback) {
        fsAdaptor.readExampleDataFromFS(this.hdfs_user, exampleId, (err, ret) => {
            if (err) {
                this._localExampleCache.delete(exampleId, {}, ()=>{});
            } else {
                let infoJson=JSON.parse(ret);
                this._localExampleCache.set(exampleId, infoJson, null, ()=>{});
            }
            callback();
        });
    }

    /**
     * update module cache content by moduleId
     * @param {*} moduleId
     * @param {*} callback
     */
    updateModuleCache(moduleId, callback) {
        fsAdaptor.readModuleDataFromFS(this.hdfs_user, moduleId, (err, ret) => {
            if (err) {
                this._localModuleCache.delete(moduleId, {}, ()=>{});
            } else {
                let infoJson=JSON.parse(ret);
                this._localModuleCache.set(moduleId, infoJson, null, ()=>{});
            }
            callback();
        });
    }

    /**
     * update all of example cache content
     * @param {*} callback
     */
    updateAllExampleCache(callback) {
        fsAdaptor.listExampleDir(this.hdfs_user, async (ret) => {
            if (ret.hasOwnProperty('err')) {
                return '';
            } else {
                let exampleList = JSON.parse(ret.info).FileStatuses.FileStatus;
                let keysToRemove = this._localExampleCache.getKeys();
                for (let i = 0; i < exampleList.length; i++) {
                    let exampleId = exampleList[i].pathSuffix;
                    let index = keysToRemove.indexOf(exampleId);
                    if (index !== -1) {
                        keysToRemove.splice(index, 1);
                    }
                    let infoJson=JSON.parse(await getExampleDataPromise(this.hdfs_user, exampleList[i].pathSuffix));
                    if (!infoJson.hasOwnProperty('RemoteException')) {
                        this._localExampleCache.set(exampleId, infoJson, null, ()=>{});
                    }
                }
                for (let key of keysToRemove) {
                    this._localExampleCache.delete(key, {}, ()=>{});
                }
                callback();
            }
        });
    }

    /**
     * update all of module cache content
     * @param {*} callback
     */
    updateAllModuleCache(callback) {
        fsAdaptor.listModuleDir(this.hdfs_user, async (ret) => {
            if (ret.hasOwnProperty('err')) {
                return '';
            } else {
                let mList = JSON.parse(ret.info).FileStatuses.FileStatus;
                let keysToRemove = this._localModuleCache.getKeys();
                for (let i = 0; i < mList.length; i++) {
                    let moduleId = mList[i].pathSuffix;
                    let index = keysToRemove.indexOf(moduleId);
                    if (index !== -1) {
                        keysToRemove.splice(index, 1);
                    }
                    let infoJson=JSON.parse(await getModuleMetadataPromise(this.hdfs_user, mList[i].pathSuffix));
                    if (!infoJson.hasOwnProperty('RemoteException')) {
                        this._localModuleCache.set(moduleId, infoJson, null, ()=>{});
                    }
                }
                for (let key of keysToRemove) {
                    this._localModuleCache.delete(key, {}, ()=>{});
                }
                callback();
            }
        });
    }

    /**
     * update all of module and example cache
     */
    updateAllModuleAndExampleCache(callback) {
        this.updateAllModuleCache(()=>{
            this.updateAllExampleCache(()=>{
                callback();
            });
        });
    }

    /**
     * return Module cache
     */
    getModuleCache() {
        return this._localModuleCache.getAll();
    }

    /**
     * return Example cache
     */
    getExampeCache() {
        return this._localExampleCache.getAll();
    }
}

module.exports = HDFSCache;
