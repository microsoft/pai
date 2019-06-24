var glob = require('glob');
var gulp = require('gulp');
var os = require('os');
var path = require('path');
var decompress = require('gulp-decompress');
var download = require('gulp-download');

function installVscodeYamlExtension() {
    const version = '0.4.0';
    const extensionPath = path.join(os.homedir(), `.vscode/extensions/redhat.vscode-yaml-${version}`);
    const existingExtensions = glob.sync(extensionPath.replace(version, '*'));
    console.log(`extensionPath: ${extensionPath}`);
    if (existingExtensions.length === 0) {
        return download(`https://github.com/redhat-developer/vscode-yaml/releases/download/0.4.0/redhat.vscode-yaml-0.4.0.vsix`)
            .pipe(decompress({
                filter: (file) => file.path.startsWith('extension/'),
                map: (file) => {
                    file.path = file.path.slice(10);
                    return file;
                }
            }))
            .pipe(gulp.dest(extensionPath));
    }
}

installVscodeYamlExtension();