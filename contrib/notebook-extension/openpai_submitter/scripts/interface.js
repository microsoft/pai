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

define([
  'require',
  'jquery',
  'base/js/namespace',
  'base/js/events',
  'nbextensions/openpai_submitter/scripts/config'
],
function (requirejs, $, Jupyter, events, config) {
  var panel
  var codeMain
  var codeStorage
  var pool = [] // {token: "token", resolveFunc: resolveFunc, rejectFunc: rejectFunc}

  function getToken () {
    return Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)
  }

  function initiate (panelInstance, resolve, reject) {
    /* save the python code to codeMain */
    panel = panelInstance
    var mainUrl = requirejs.toUrl('../main.py')
    var storageUrl = requirejs.toUrl('../data.py')
    var loadMain = new Promise(
      function (resolve, reject) {
        $.get(mainUrl).done(function (data) {
          codeMain = data
          resolve()
        })
      })
    var loadStorage = new Promise(
      function (resolve, reject) {
        $.get(storageUrl).done(function (data) {
          codeStorage = data
          resolve()
        })
      })
    Promise.all([loadMain, loadStorage]).then(
      () => resolve()
    ).catch((e) => reject(e))
  }

  var getIOPub = function (resolve, reject) {
    return {
      output: function (msg) {
        /*
        A callback to handle python execution.
        Note: This function will be executed multiple times,
        if any stdout/stderr comes out.
        */
        function parseSingleOutput (token, msgContent) {
          /*
          msgContent: parsed JSON, such as: {"code": 0, "message": ""}
          */
          for (var pooledToken in pool) {
            if (pooledToken === token) {
              if (msgContent['code'] !== 0) { pool[token]['rejectFunc'](msgContent['message']) } else { pool[token]['resolveFunc'](msgContent['message']) }
              delete pool[token]
              return
            }
          }
          console.error('[openpai submitter] Unknown token', token)
        }
        console.log('[openpai submitter] [code return]:', msg)
        if (msg.msg_type === 'error') {
          reject(msg.content.evalue)
        } else if (msg.content.name !== 'stdout') {
          // ignore any info which is not stdout
          console.error(msg.content.text)
        } else {
          try {
            var m = msg.content.text
            var tokens = m.match(/__openpai\$(.{8})__/g)
            if (tokens === null || tokens.length === 0) {
              console.error(m)
              return
            }
            var splittedMSG = m.split(/__openpai\$.{8}__/)
            var i = 0
            for (var item of splittedMSG) {
              item = $.trim(item)
              if (item === '') continue
              var jsonMSG = JSON.parse(item)
              parseSingleOutput(tokens[i].substr(10, 8), jsonMSG)
              i += 1
            }
          } catch (e) {
            console.error(e)
          }
        }
      }
    }
  }

  // return a promise
  function executePromise (initCode, code) {
    return new Promise(
      function (resolve, reject) {
        if (!(Jupyter.notebook.kernel.is_connected())) {
          console.error('Cannot find active kernel.')
          throw new Error('Cannot find active kernel. Please wait until the kernel is ready and refresh.')
        }
        resolve()
      }
    ).then(
      function () {
        console.log('[openpai submitter] [code executed]:' + code)
        return new Promise(
          function (resolve, reject) {
            /* replace <openpai_token> with real token */
            var token = getToken()
            code = code.replace('<openpai_token>', token)
            var codeMerged = initCode + '\n' + code
            /* register final resolve / reject */
            pool[token] = {
              resolveFunc: resolve,
              rejectFunc: reject
            }
            /* execute */
            Jupyter.notebook.kernel.execute(
              codeMerged, {
                iopub: getIOPub(resolve, reject)
              }
            )
          })
      }
    )
  }

  return {
    initiate: initiate,

    // main api
    read_defaults:
                () => executePromise(codeMain, 'openpai_ext_interface.read_defaults("<openpai_token>")'),
    tell_resources:
                () => executePromise(codeMain, 'openpai_ext_interface.tell_resources("<openpai_token>")'),
    available_resources:
                () => executePromise(codeMain, 'openpai_ext_interface.available_resources("<openpai_token>")'),
    zip_and_upload:
                (ctx) => executePromise(codeMain, 'openpai_ext_interface.zip_and_upload("<openpai_token>",' + JSON.stringify(ctx) + ')'),
    submit_job:
                (ctx) => executePromise(codeMain, 'openpai_ext_interface.submit_job("<openpai_token>",' + JSON.stringify(ctx) + ')'),
    wait_jupyter:
                (ctx) => executePromise(codeMain, 'openpai_ext_interface.wait_jupyter("<openpai_token>",' + JSON.stringify(ctx) + ')'),
    detect_jobs:
                (jobsCtx) => executePromise(codeMain, 'openpai_ext_interface.detect_jobs("<openpai_token>",' + JSON.stringify(jobsCtx) + ')'),

    // storage api
    add_job:
                (record) => executePromise(codeStorage, 'openpai_ext_storage.add("<openpai_token>",' + JSON.stringify(record) + ')'),
    get_jobs:
                () => executePromise(codeStorage, 'openpai_ext_storage.get("<openpai_token>")'),
    save_jobs:
                (data) => executePromise(codeStorage, 'openpai_ext_storage.save("<openpai_token>", ' + JSON.stringify(data) + ')')

  }
}
)
