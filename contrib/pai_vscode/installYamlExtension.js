var path = require('path');
var os = require('os');

async function downloadAndUnzipExtension(url, path, cb) {
    var unzipper = require('unzipper');
    var request = require('request');
    var fs = require('fs');
    var getDirName = require('path').dirname;

    request(url).pipe(unzipper.Parse()).on('entry', function (entry) {
        if (entry.path.startsWith('extension/')) {
            var newPath = path + '/' + entry.path.slice(10);
            fs.mkdirSync(getDirName(newPath), { recursive: true });
            entry.pipe(fs.createWriteStream(newPath));
        } else {
            entry.autodrain();
        }
    }).on('finish', cb);
}

function installVscodeYamlExtension() {
    const version = '0.4.0';
    const extensionPath = path.join(os.homedir(), `.vscode/extensions/redhat.vscode-yaml-${version}-test`);
    console.log(`extensionPath: ${extensionPath}`);
    const url = `https://github.com/redhat-developer/vscode-yaml/releases/download/0.4.0/redhat.vscode-yaml-0.4.0.vsix`;
    downloadAndUnzipExtension(url, extensionPath, function() {
        var exec = require('child_process').exec;
        var parentPath = path.join(os.homedir(), `.vscode/extensions`);
        exec(`ls ${parentPath}`, function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    });
}

installVscodeYamlExtension();