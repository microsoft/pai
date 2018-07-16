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

require('./template-import.component.scss');
require('json-editor'); /* global JSONEditor */
// for model start
require('bootstrap/js/modal.js');
// for model end
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateImportComponent = require('./template-import.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('./template-import.schema.js');
// for model start
const userEditModalComponent = require('./submit-modal-component.ejs');
// for model end

const templateViewHtml = templateImportComponent({
    breadcrumb: breadcrumbComponent,
    loading: loadingComponent
});

// for model start
const showEditInfo = () => {
    $('#modalPlaceHolder').html(userEditModalComponent);
    $('#userEditModal').modal('show');
};
// for model end

const restApi2JsonEditor = (data) => {
    let res = { 'data': [], 'script': [], 'docker': [] };
    if ('job' in data) {
        let d = data['job'];
        let tasks = d['tasks'];
        d['tasks'] = [];
        tasks.forEach(task => {
            let val = 1;
            if (typeof task['resource']['instances'] == 'string') {
                let paths = task['resource']['instances'].substring(1).split('.');
                val = data;
                for (let i = 0; i < paths.length && val != undefined; i++) {
                    if (paths[i] in val) {
                        val = val[paths[i]];
                    } else {
                        val = val.filter((element) => element.name == paths[i]).pop();
                    }
                }
                if (typeof val != 'number') {
                    val = 1;
                }
            }
            d['tasks'].push({
                'role': task['name'],
                'instances': val, // the task['resource']['instances'] is a string like '$job.parameters.num_of_worker', not a int.
                'data': task['data'],
                'cpu': task['resource']['resourcePerInstance']['cpu'],
                'script': task['script'],
                'gpu': task['resource']['resourcePerInstance']['gpu'],
                'dockerimage': task['dockerimage'],
                'memoryMB': task['resource']['resourcePerInstance']['memoryMB'],
                'env': task['env'],
                'command': task['command'],
            });
        });
        res['job'] = d;
    }
    if ('prerequisites' in data) {
        Object.keys(data['prerequisites']).forEach(function (key) {
            let item = data['prerequisites'][key];
            switch (item['type']) {
                case "data":
                    res['data'].push(item);
                    break;
                case "script":
                    res['script'].push(item);
                    break;
                case "dockerimage":
                    res['docker'].push(item);
                    break;
            }
        })
    }
    return res;
};

const jsonEditor2RestApi = (data) => {
    let res = {
        'prerequisites':[],
    };
    if ('job' in data) {
        let jobs = data['job']; // is a array, but I assume only one job.
        jobs.forEach(job => {
            job['type'] = 'job';
            let tasks = job['tasks'];
            job['parameters'] = JSON.parse(job['parameters']);
            job['tasks'] = [];
            tasks.forEach(task=>{
                let env = {}
                if ('env' in task && task['env'] != '') {
                    env = JSON.parse(task['env']);
                }
                job['tasks'].push({
                    'name': task['role'],
                    'data': task['data'],
                    'dockerimage':  task['dockerimage'],
                    'command': JSON.parse(task['command']),
                    'script': task['script'],
                    'env': env,
                    'resource':{
                        'instances': task['instances'],
                        'resourcePerInstance': {
                            'cpu': task['cpu'],
                            'gpu': task['gpu'],
                            'memoryMB': task['memoryMB']
                        }
                    }
                });
            });
            res['job'] = job;
        });
    }

    ['data', 'script', 'docker'].forEach(t =>{
        data[t].forEach(d=>{
            d['type'] = t == 'docker'? 'dockerimage': t;
            res['prerequisites'].push(d); // Warning: may add features or action field.
        });
    });
    console.log(res);
    return res;
};


let editor;
let jobDefaultConfig;

const isValidJson = (str) => {
    let valid = true;
    let errors = null;
    try {
        let json = JSON.parse(str);
        errors = editor.validate(json);
        if (errors.length) {
            valid = false;
            errors = errors[0].path.replace('root.', '') + ': ' + errors[0].message;
        }
    } catch (e) {
        errors = e.message;
        valid = false;
    }
    if (!valid) {
        alert('Please upload a valid json file: ' + errors);
    }
    return valid;
};

const exportFile = (data, filename, type) => {
    let file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
        let a = document.createElement('a');
        let url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
};

const submitJob = (jobConfig) => {
    userAuth.checkToken((token) => {
        loading.showLoading();
        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobConfig.job.name}`,
            data: JSON.stringify(jobConfig),
            headers: {
                Authorization: `Bearer ${token}`,
            },
            contentType: 'application/json; charset=utf-8',
            type: 'PUT',
            dataType: 'json',
            success: (data) => {
                loading.hideLoading();
                if (data.error) {
                    alert(data.message);
                    $('#submitHint').text(data.message);
                } else {
                    alert('submit success');
                    $('#submitHint').text('submitted successfully!');
                }
                window.location.replace('/view.html');
            },
            error: (xhr, textStatus, error) => {
                loading.hideLoading();
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
            },
        });
    });
};

const loadEditor = () => {
    let element = $('#editor-holder')[0];
    editor = new JSONEditor(element, {
        schema: jobSchema,
        theme: 'bootstrap3',
        iconlib: 'bootstrap3',
        disable_array_reorder: true,
        no_additional_properties: true,
        show_errors: 'always',
    });
    jobDefaultConfig = editor.getValue();
};
// for model start
window.showEditInfo = showEditInfo;
// for model end
const resize = () => {
    let heights = window.innerHeight;
    $('#editor-holder')[0].style.height = heights - 300 + 'px';
};

$('#sidebar-menu--submit-job').addClass('active');

$('#content-wrapper').html(templateViewHtml);
$(document).ready(() => {
    loadEditor();

    // fill table
    const searchParams = new URLSearchParams(window.location.search);
    let name = searchParams.get('name');
    let version = searchParams.get('version');
    if (name != null && version != null) {
        $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/template/${name}/${version}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                data = restApi2JsonEditor(data);
                // console.log(data);
                editor.setValue(data);
            }
        });
    }

    editor.on('change', () => {
        $('#submitJob').prop('disabled', (editor.validate().length != 0));
    });

    $(document).on('change', '#fileUpload', (event) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const jobConfig = event.target.result;
            if (isValidJson(jobConfig)) {
                editor.setValue(Object.assign({}, jobDefaultConfig, JSON.parse(jobConfig)));
            }
        };
        reader.readAsText(event.target.files[0]);
        $('#fileUpload').val('');
    });
    $(document).on('click', '#submitJob', () => {
        showEditInfo();
    });
    $(document).on('click', '#fileExport', () => {
        exportFile(JSON.stringify(editor.getValue(), null, 4),
            (editor.getEditor('root.jobName').getValue() || 'jobconfig') + '.json',
            'application/json');
    });
    resize();
    window.onresize = function () {
        resize();
    };

    $(document).on('click', '#single', () => {
        submitJob(jsonEditor2RestApi(editor.getValue()));
    });
});

module.exports = { submitJob, showEditInfo };

