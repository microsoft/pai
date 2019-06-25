/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *  @author Microsoft
 */

var fs = require('fs');
var getDirName = require('path').dirname;
var os = require('os');
var path = require('path');
var request = require('request');
var unzipper = require('unzipper');

function mkDirByPathSync(targetDir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') {
                return curDir;
            }
        }
        return curDir;
    }, initDir);
}

async function downloadAndUnzipExtension(url, dest) {
    request(url).pipe(unzipper.Parse()).on('entry', function (entry) {
        if (entry.path.startsWith('extension/')) {
            var newPath = path.resolve(dest, entry.path.slice(10));
            mkDirByPathSync(getDirName(newPath));
            entry.pipe(fs.createWriteStream(newPath));
        } else if (entry.path === 'extension.vsixmanifest') {
            var newPath = path.resolve(dest, entry.path.slice(9));
            mkDirByPathSync(getDirName(newPath));
            entry.pipe(fs.createWriteStream(newPath));
        } else {
            entry.autodrain();
        }
    });
}

function installVscodeYamlExtension() {
    const version = '0.4.0';
    const extensionPath = path.join(os.homedir(), `.vscode/extensions/redhat.vscode-yaml-${version}`);
    const url = `https://github.com/redhat-developer/vscode-yaml/releases/download/0.4.0/redhat.vscode-yaml-0.4.0.vsix`;
    downloadAndUnzipExtension(url, extensionPath);
}

installVscodeYamlExtension();
