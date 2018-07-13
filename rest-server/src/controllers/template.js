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


const appRoot = require('app-root-path');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../config/logger');

const basePath = path.join(appRoot.path, 'marketplace');

// parse the json data to template summary format.
const toTemplateSummary = (data) =>{
    let res = {'datasets': [], 'scripts': [], 'dockers': []};
    if ('job' in data) {
        let d = data['job'];
        res['name'] = d['name'];
        res['type'] = 'job';
        res['version'] = d['version'];
        res['contributors'] = [d['contributor']]; // todo split the contributor string?
        res['description'] = d['description'];
    }
    if ('prerequisites' in data) {
        Object.keys(data['prerequisites']).forEach(function(key) {
            let d = data['prerequisites'][key];
            let item = {
                'name': d['name'],
                'version': d['version'],
            };
            switch (d['type']) {
                case 'data':
                    res['datasets'].push(item);
                    break;
                case 'script':
                    res['scripts'].push(item);
                    break;
                case 'dockerimage':
                    res['dockers'].push(item);
                    break;
            }
        });
    }
    return res;
};

const list = (req, res) => {
    let templateList = [];
    fs.readdirSync(basePath).forEach((filename) => {
        templateList.push(toTemplateSummary(yaml.safeLoad(fs.readFileSync(`${basePath}/${filename}`, 'utf8'))));
    });
    return res.status(200).json(templateList);
};

const recommend = (req, res) => {
    let count = req.param('count', 3);
    let filenames = fs.readdirSync(basePath);
    if (count > filenames.length) {
        return res.status(404).json({
            'message': 'The value of the "count" parameter must be less than the number of templates',
        });
    } else {
        let templateList = [];
        for (let i = 0; i < count; ++i) {
            templateList.push(toTemplateSummary(yaml.safeLoad(fs.readFileSync(`${basePath}/${filenames[i]}`, 'utf8'))));
        }
        return res.status(200).json(templateList);
    }
};

const getTemplateByNameAndVersion = (req, res) =>{
    let name = req.param('name');
    let version = req.param('version');

    let data = getTemplate(name, version);
    if (data) {
        return res.status(200).json(data);
    } else {
        return res.status(404).json({
            'message': 'Not Found',
        });
    }
};

const getTemplate = function(name, version) {
    let filenames = fs.readdirSync(basePath);
    for (let i = 0; i < filenames.length; ++i) {
        let data = yaml.safeLoad(fs.readFileSync(`${basePath}/${filenames[i]}`, 'utf8'));
        if ('job' in data) {
            let d = data['job'];
            if (d['name'] == name && d['version'] == version) {
                return data;
            }
        }
    }
    return null;
};

const share = (req, res) => {
    let data = req.body;
    let template = data.template;
    let job = template.job;
    if (!getTemplate(job.name, job.version)) {
        let filename = new Date().getTime() + '.yaml';
        fs.writeFile(`${basePath}/${filename}`, yaml.safeDump(template), function(error) {
            if (error) {
                logger.error(error);
                res.status(500).json({
                    message: 'IO error happened when stroing template.',
                });
            } else {
                res.status(201).json({
                    name: job.name,
                    version: job.version,
                });
            }
        });
    } else {
        res.status(400).json({
            message: `The template titled "${job.name}:${job.version} has already existed.".`,
        });
    }
};

module.exports = {
    list,
    recommend,
    getTemplateByNameAndVersion,
    share,
};
