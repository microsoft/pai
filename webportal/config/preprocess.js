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
const fse = require('fs-extra');
const archiver = require('archiver');
const helpers = require('./helpers');
const webportalConfig = require('./webportal.config');


// pack utils for downloading
fse.ensureDirSync(helpers.root('src/assets/util'));
const output = fse.createWriteStream(helpers.root('src/assets/util/pai-fs.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});
archive.pipe(output);
archive.directory(helpers.root('../pai-fs'), 'pai-fs');
archive.finalize();

// copy docs to app
fse.copySync(
    helpers.root('../job-tutorial/README.md'),
    helpers.root('src/app/job/job-docs/job-docs.md'));

fse.copySync(
    helpers.root('../job-tutorial/tensorflow/tensorflow-distributed-example.json'),
    helpers.root('src/app/job/job-submit/job-submit.example.json'));

// write env config
fse.outputJsonSync(
    helpers.root('src/app/config/webportal.config.json'),
    webportalConfig);