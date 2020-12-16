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
"use strict";

export default function parseData(data) {
    let detailData = null;
    try {
        detailData = JSON.parse(data.detail).parameters;
    } catch (err) {
        alert(err);
    }

    let interfaceStr = data.info.match(/i=".*?"/);
    let runStr = interfaceStr.toString().slice(3, -1);
    let optionalStrs = interfaceStr.toString().match(/\[.*?\]/g);
    let paraStrs = interfaceStr.toString().match(/\(.*?\)/g);
    let clusterStr = interfaceStr.toString().match(/%CLUSTER.*?\)/);
    let inputStrs = interfaceStr.toString().match(/\{.*?\}/g); //file selection type
    let clusterParaStr = '';
    if (clusterStr != null) {
        clusterStr = clusterStr.toString().match(/\(.*?\)/);
        let clusterStrSegs = clusterStr.toString().slice(1, -1).split(':');
        clusterParaStr = clusterStrSegs[0];
    }

    let nameDict = {};
    let defaultDict = {};
    let enumDict = {};
    let describeDict = {};
    let dynaDict = {};
    let inputTypeDict = {};
    let fileNameDict = {};
    let errorMsgDict = {};
    let displayNameDict = {};
    let paramDescDict = {};
    let paramIsHiddenDict = {}; 
    let isRequiredDict = {}; //detect if the field is optional or required
    let isValidDict = {}; //detect if the field is valid
    let pos = 0;
    if (inputStrs) {
        for (let k = 0; k < inputStrs.length; k++) {
            isRequiredDict[pos] = true;
            isValidDict[pos] = true;
            if (optionalStrs) {
                for (let i = 0; i < optionalStrs.length; i ++) {
                    if(optionalStrs[i].includes(inputStrs[k])) {
                        isRequiredDict[pos] = false;
                    }
                }
            }
            let segs = inputStrs[k].slice(1, -1).split(':');
            //parse file selection parameter
            if (segs[0] === 'in') {
                nameDict[pos] = segs[2];
                paramDescDict[pos] = `parameter: ${segs[2]}\n`
                if (detailData && detailData.hasOwnProperty(segs[2]) && detailData[segs[2]].description) {
                    paramDescDict[pos] += `description: ${detailData[segs[2]].description}`;
                }
                if (detailData && detailData.hasOwnProperty(segs[2]) && detailData[segs[2]].hidden === 'true') {
                    paramIsHiddenDict[pos] = true;
                }
                if (detailData && detailData.hasOwnProperty(segs[2]) && detailData[segs[2]].default) {
                    defaultDict[pos] = detailData[segs[2]].default;
                }
                displayNameDict[pos] = parseParamDisplayName(segs[2]);
                let inputMethod = ['local path', 'remote path'];
                enumDict[pos] = inputMethod;
                dynaDict[pos] = 'choose';
                inputTypeDict[pos] = 'remote path';
                fileNameDict[pos] = '';
                pos++;
            }
        }
    }
    for (let i = 0; i < paraStrs.length; i++) {
        isRequiredDict[pos] = true;
        isValidDict[pos] = true;
        paramIsHiddenDict[pos] = false;
        if (optionalStrs) {
            for (let j = 0; j < optionalStrs.length; j ++) {
                if(optionalStrs[j].includes(paraStrs[i])) {
                    isRequiredDict[pos] = false;
                }
            }
        }
        let paraStr = paraStrs[i].replace(/hdfs:/g, 'hdfs&#58').replace(/http:/g, 'http&#58').replace(/https:/g, 'https&#58');
        
        let segs = paraStr.slice(1, -1).split(':');
        nameDict[pos] = segs[0];
        paramDescDict[pos] = `parameter: ${segs[0]}\n`
        if (detailData && detailData.hasOwnProperty(segs[0]) && detailData[segs[0]].description) {
            paramDescDict[pos] += `description: ${detailData[segs[0]].description}`;
        }
        if (detailData && detailData.hasOwnProperty(segs[0]) && detailData[segs[0]].hidden === 'true') {
            paramIsHiddenDict[pos] = true;
        }
        displayNameDict[pos] = parseParamDisplayName(segs[0]);
        errorMsgDict[pos] = '';
        for (let k = 1; k < segs.length; k++) {
            let seg = segs[k].replace(/hdfs&#58/g, 'hdfs:').replace(/http&#58/g, 'http:').replace(/https&#58/g, 'https:');
            let commands = seg.split(',');
            if (commands[0] === 'default') {
                defaultDict[pos] = commands[1];
            } else if (commands[0] === 'enum') {
                enumDict[pos] = commands.slice(1);
            } else if (commands[0] === 'int') {
                let left = commands.length > 1 ? commands[1] : '';
                let right = (commands.length > 2 && commands[2] != '') ? commands[2] : '...';
                let describeStr = 'int [' + left + ',' + right + ']';
                describeDict[pos] = describeStr;
            } else {
                describeDict[pos] = commands.toString();
            }
        }
        pos++;
    }
    return [nameDict, defaultDict, enumDict, describeDict, dynaDict, inputTypeDict, fileNameDict, errorMsgDict, displayNameDict, 
            paramDescDict, paramIsHiddenDict, isRequiredDict, isValidDict, runStr, clusterParaStr]
}

function parseParamDisplayName(name) {
    return name
           .replace(/_/, ' ')
           .replace(/([a-z])([A-Z])/g, '$1 $2')
           .replace(/^./, function(str){ return str.toUpperCase(); })
}
