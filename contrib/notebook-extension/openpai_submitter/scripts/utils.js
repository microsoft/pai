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

define(['require'], function (requirejs) {
  return {
    getLoadingImg: function (idName) {
      var loadingImg
      if (idName !== undefined) { loadingImg = '<img src="' + requirejs.toUrl('../misc/loading.gif') + '" class="loading-img" id="' + idName + '"></img>' } else { loadingImg = '<img src="' + requirejs.toUrl('../misc/loading.gif') + '" class="loading-img"></img>' }
      return loadingImg
    },
    getLoadingImgSmall: function (idName) {
      var loadingImg
      if (idName !== undefined) { loadingImg = '<img src="' + requirejs.toUrl('../misc/loading.gif') + '" class="loading-img-small" id="' + idName + '"></img>' } else { loadingImg = '<img src="' + requirejs.toUrl('../misc/loading.gif') + '" class="loading-img-small"></img>' }
      return loadingImg
    },
    copy_to_clipboard: function (text) {
      return new Promise(function (resolve, reject) {
        function fallbackCopyTextToClipboard (text) {
          var textArea = document.createElement('textarea')
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          try {
            var successful = document.execCommand('copy')
            var msg = successful ? 'successful' : 'unsuccessful'
            resolve()
          } catch (err) {
            reject(err)
          }
          document.body.removeChild(textArea)
        }
        function copyTextToClipboard (text) {
          if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text)
            return
          }
          navigator.clipboard.writeText(text).then(function () {
            resolve()
          }, function (err) {
            reject(err)
          })
        }
        copyTextToClipboard(text)
      })
    },
    set_timeout: function timeout (ms, value) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, ms, value)
      })
    },
    set_timeout_func: function timeoutFunc (ms, func, args) {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          func.apply(args)
          resolve()
        }, ms)
      })
    }
  }
})
