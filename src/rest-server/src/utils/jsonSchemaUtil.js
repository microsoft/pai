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

let jsonSchemaKeys = new Set(['type', 'default', 'minimum', 'maximum', 'enum', 'minLength', 'maxLength', 'description']);

function getJsonSchemaContent(properties) {
    let jsonSchemaContent = JSON.parse('{ "title": "JSON schema for Babel 6+ configuration files", "$schema": "http://json-schema.org/draft-04/schema#", "type": "object"}');

    let jsonSchemaProperties = {};
    let requiredProperties = [];

    Object.keys(properties).forEach(function(property) {
        let newItems = {};
        if (properties[property].hasOwnProperty('required') && properties[property]['required'] === 'true') {
            requiredProperties.push(property);
        }
        for (let item in properties[property]) {
            if (jsonSchemaKeys.has(item)) {
                newItems[item] = properties[property][item];
            }
        }
        jsonSchemaProperties[property] = newItems;
    });

    jsonSchemaContent['properties'] = jsonSchemaProperties;
    jsonSchemaContent['required'] = requiredProperties;

    return jsonSchemaContent;
}

// module exports
module.exports = {
    getJsonSchemaContent,
};
