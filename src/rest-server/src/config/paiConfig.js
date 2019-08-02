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

// module dependencies
const axios = require('axios');
const {Agent} = require('https');
const Joi = require('joi');
const yaml = require('js-yaml');
const {get} = require('lodash');
const fs = require('fs');
const logger = require('@pai/config/logger');
const {apiserver} = require('@pai/config/kubernetes');

let paiMachineList = [];
try {
    paiMachineList = yaml.safeLoad(fs.readFileSync('/pai-cluster-config/layout.yaml', 'utf8'))['machine-list'];
} catch (err) {
    paiMachineList = [];
    logger.warn('Unable to load machine list from cluster-configuration.');
    logger.warn('The machine list will be initialized as an empty list.');
}

let paiConfigData = {
    machineList: paiMachineList,
    version: null,
    debuggingReservationSeconds: Number(process.env.DEBUGGING_RESERVATION_SECONDS || '604800'),
};


// define the schema for pai configuration
const paiConfigSchema = Joi.object().keys({
    machineList: Joi.array(),
    version: Joi.string().allow(null),
    debuggingReservationSeconds: Joi.number().integer().positive(),
}).required();


const {error, value} = Joi.validate(paiConfigData, paiConfigSchema);
if (error) {
    throw new Error(`config error\n${error}`);
}
paiConfigData = value;

const fetchPAIVersion = async () => {
    try {
        const res = await axios.request({
            url: '/api/v1/namespaces/default/configmaps/pai-version',
            baseURL: apiserver.uri,
            maxRedirects: 0,
            httpsAgent: apiserver.ca && new Agent({ca: apiserver.ca}),
            headers: apiserver.token && {Authorization: `Bearer ${apiserver.token}`},
        });

        const version = get(res.data, 'data["PAI.VERSION"]');
        if (version) {
            return version.trim();
        } else {
            return null;
        }
    } catch (err) {
        throw err;
    }
};

fetchPAIVersion().then(
    (res) => {
        paiConfigData.version = res;
    }
).catch(() => {
    logger.warn('Unable to load pai version from config map.');
});

module.exports = paiConfigData;
