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
  '//cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js',
  'nbextensions/openpai_submitter/scripts/panel',
  'nbextensions/openpai_submitter/scripts/panel_recent'
], function (requirejs, $, Jupyter, events, _, Panel, PanelRecent) {
  function loadCss (filename) {
    var cssUrl = requirejs.toUrl(filename)
    $('head').append(
      $('<link rel="stylesheet" type="text/css" />')
        .attr('href', cssUrl)
    )
  }

  function registerButtonPanel () {
    var handler = function () {
      panel.send(panel.MSG.CLICK_BUTTON)
    }
    var action = {
      icon: 'fa-rocket', // a font-awesome class used on buttons, etc
      help: 'openpai-submitter',
      help_index: 'zz',
      handler: handler
    }
    var prefix = 'my_extension'
    var actionName = 'show-panel'
    var fullActionName = Jupyter.actions.register(action, actionName, prefix)
    Jupyter.toolbar.add_buttons_group([fullActionName])
  }
  function registerButtonPanelRecent () {
    var handler = function () {
      panelRecent.send(panelRecent.MSG.CLICK_BUTTON)
    }
    var action = {
      icon: 'fa-list-alt', // a font-awesome class used on buttons, etc
      help: 'openpai-submitter',
      help_index: 'zz',
      handler: handler
    }
    var prefix = 'my_extension'
    var actionName = 'show-panel-recent'
    var fullActionName = Jupyter.actions.register(action, actionName, prefix)
    Jupyter.toolbar.add_buttons_group([fullActionName])
  }
  var panel = Panel()
  var panelRecent = PanelRecent()

  function loadIPythonExtension () {
    loadCss('./misc/style.css')
    loadCss('//cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css')
    panel.send(panel.MSG.PLEASE_INIT)
    panelRecent.send(panelRecent.MSG.PLEASE_INIT)
    registerButtonPanel()
    registerButtonPanelRecent()
    panel.bindPanelRecent(panelRecent)
    panelRecent.bindPanel(panel)
  }
  return {
    load_ipython_extension: loadIPythonExtension
  }
})
