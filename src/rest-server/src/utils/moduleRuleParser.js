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

// to convert module interface string to parameter object
function moduleRuleParser(interfaceStr) {
    let paras = {};
    let items = interfaceStr.match(/\[\{.*?\}\]|\{.*?\}|\[\(.*?\)\]|\(.*?\)/g);
    for (let i = 0; i < items.length; i++) {
        let property = {};
        let name;
        let item = items[i];
        if (item.startsWith('[')) {
            property['required'] = 'false';
            item = item.slice(1, -1);
        } else {
            property['required'] = 'true';
        }
        if (item.startsWith('{')) {// handle IO parameter, follow style {out:AnyFile:OutputHdfsDir}
            let words = item.slice(1, -1).split(':');
            if (words.length != 3) {
                throw new Error('Invalid format:' + item);
            }
            if (words[0] === 'in') {
                property['input'] = 'true';
                name = words[2];
                if (property['required'] === 'true') {
                    property['minLength'] = 1;
                }
                paras[name] = property;
            } else {
                continue; // not list output parameter
            }
        } else if (item.startsWith('(')) {
            if (item.match(/^\((\w+):int,(-?\d*),(-?\d*)(:default,(-?\d+))?\)$/g)) {// (name:int,min,max:default,value)
                let groups = item.match(/^\((\w+):int,(-?\d*),(-?\d*)(:default,(-?\d+))?\)$/);

                name = groups[1];

                if (groups[2] != undefined && groups[2] != '') {
                    property['minimum'] = JSON.parse(groups[2]);
                }
                if (groups[3] != undefined && groups[3] != '') {
                    property['maximum'] = JSON.parse(groups[3]);
                }
                if (groups[5] != undefined && groups[5] != '') {
                    property['default'] = JSON.parse(groups[5]);
                }
                property['type'] = 'integer';
            } else if (item.match(/^\((\w+):float,(-?\d*.\d*),(-?\d*.\d*)(:default,(-?\d*.\d*))?\)$/g)) {// (name:float,min,max:default,value)
                let groups = item.match(/^\((\w+):float,(-?\d*.\d*),(-?\d*.\d*)(:default,(-?\d*.\d*))?\)$/);

                name = groups[1];

                if (groups[2] != undefined && groups[2] != '') {
                    property['minimum'] = groups[2];
                }
                if (groups[3] != undefined && groups[3] != '') {
                    property['maximum'] = groups[3];
                }
                if (groups[5] != undefined && groups[5] != '') {
                    property['default'] = groups[5];
                }
                property['type'] = 'number';
            } else if (item.match(/^\((\w+):enum,(.*)\)$/g)) {// (name:enum,value1,value2:default,value)
                let groups = item.match(/^\((\w+):enum,(.*)\)$/);
                name = groups[1];
                property['type'] = 'string';
                let words = groups[2].split(':default,');
                property['enum'] = words[0].split(',');
                if (words[1] != undefined && words[1] != '') {
                    property['default'] = words[1];
                }
            } else if (item.match(/^\((\w+)(:default,(.+))?\)$/g)) {// (name:default,value)
                let groups = item.match(/^\((\w+)(:default,(.+))?\)$/);
                name = groups[1];
                property['type'] = 'string';
                if (groups[3] != undefined && groups[3] != '') {
                    property['default'] = groups[3];
                }
                if (property['required'] === 'true') {
                    property['minLength'] = 1;
                }
            } else {
                throw new Error('Invalid format:' + item);
            }
            if (name.toLowerCase() === 'name') {// skip the 'name' parameter as equal to framework name
                continue;
            }
            paras[name] = property;
        } else {
            throw new Error('Invalid format');
        }
    }
    return paras;
}

function mergeModuleParameters(infoParameters, detailParameters) {
    let key;
    let result = {};

    for (key in infoParameters) {
        if (detailParameters.hasOwnProperty(key)) {
            result[key] = Object.assign({}, infoParameters[key], detailParameters[key]);
        } else {
            result[key] = infoParameters[key];
        }
    }

    return result;
}

// module exports
module.exports = {
    moduleRuleParser,
    mergeModuleParameters,
};
