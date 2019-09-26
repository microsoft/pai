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
  'nbextensions/openpai_submitter/scripts/config',
  'nbextensions/openpai_submitter/scripts/interface',
  'nbextensions/openpai_submitter/scripts/utils'
],
function (requirejs, $, Jupyter, events, config, Interface, Utils) {
  function Panel () {
    var STATUS_R = [
      'NOT_READY',
      'READY_NOT_LOADING',
      'READY_LOADING',
      'SHOWING_INFO',
      'ERROR',
      'FATAL'
    ]
    var MSG_R = [
      'PLEASE_INIT',
      'INIT_OK',
      'ADD_JOB',
      'CLICK_BUTTON',
      'CLICK_CLOSE',
      'CLICK_REFRESH',
      'ERROR',
      'FATAL_ERROR'
    ]

    var STATUS = {}
    for (var i = 0; i < STATUS_R.length; i += 1) { STATUS[STATUS_R[i]] = i }
    var MSG = {}
    for (var j = 0; j < MSG_R.length; j += 1) { MSG[MSG_R[j]] = j }

    var set = function (s) {
      // console.log('[openpai submitter] [panel-recent] set status', STATUS_R[s])
      status = s
    }

    var status
    var panel // main panel
    var jobStatusFinished = ['FAILED', 'STOPPED', 'SUCCEEDED']
    var hasAddFilter = false

    set(STATUS.NOT_READY)

    var speed = config.panel_toggle_speed

    var showInformation = function (info) {
      /* this function will hide table and show information for users. */
      $('#panel-recent-table-wrapper').hide()
      $('#panel-recent-information-wrapper').show()
    }

    var appendInformation = function (info) {
      $('#panel-recent-information').append(info)
    }

    var send = function (msg, value) {
      // console.log('[openpai submitter] [panel-recent]', 'status:', STATUS_R[status], 'msg', MSG_R[msg], 'value', value)
      switch (msg) {
        case MSG.PLEASE_INIT:
          handleInit()
          break
        case MSG.INIT_OK:
          handleInitOK()
          break
        case MSG.ADD_JOB:
          handleAddJob(value)
          break
        case MSG.CLICK_BUTTON:
          if (!($('#openpai-panel-recent-wrapper').is(':visible'))) {
            if ((status !== STATUS.READY_LOADING) && (status !== STATUS.FATAL)) {
              Utils.set_timeout(config.panel_toggle_speed).then(
                () => send(MSG.CLICK_REFRESH)
              )
            }
          }
          togglePanel()
          break
        case MSG.CLICK_CLOSE:
          closePanel()
          break
        case MSG.CLICK_REFRESH:
          handleRefresh()
          break
        case MSG.ERROR:
          handleError(value)
          break
        case MSG.FATAL_ERROR:
          handleFatalError(value)
          break
        default:
          send(MSG.ERROR, 'unknown message received by panel!')
      }
    }

    var turnOnFilter = function () {
      hasAddFilter = true
      $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
          /* only show unfinished jobs */
          if (settings.nTable.getAttribute('id') !== 'recent-jobs') { return true }
          return jobStatusFinished.indexOf(data[4]) < 0
        })
    }

    var turnOffFilter = function () {
      hasAddFilter = false
      $.fn.dataTable.ext.search.pop()
    }

    var handleInit = function () {
      var panelUrl = requirejs.toUrl('../templates/panel_recent.html')
      var panel = $('<div id="openpai-panel-recent-wrapper" class="openpai-wrapper"></div>').load(panelUrl)

      Promise.all([
        /* Promise 1: add panel to html body and bind functions */
        panel.promise()
          .then(
            function () {
              panel.draggable()
              panel.toggle()
              $('body').append(panel)
              $('body').on('click', '#close-panel-recent-button', function () {
                send(MSG.CLICK_CLOSE)
              })
              $('body').on('click', '#refresh-panel-recent-button', function () {
                send(MSG.CLICK_REFRESH)
              })

              turnOnFilter()

              $('body').on('click', '#openpai-if-hide-jobs', function () {
                if ($('#openpai-if-hide-jobs').prop('checked') === true &&
                  hasAddFilter === false) {
                  turnOnFilter()
                  $('#recent-jobs').DataTable().draw()
                } else if ($('#openpai-if-hide-jobs').prop('checked') === false &&
                  hasAddFilter === true) {
                  turnOffFilter()
                  $('#recent-jobs').DataTable().draw()
                }
              })
            }
          )
          .then(
            () => Utils.set_timeout(600)
          ).then(function () {
            panel.resizable()
            $('.openpai-logo').attr('src', requirejs.toUrl('../misc/pailogo.jpg'))
            $('#recent-jobs')
              .DataTable({
                dom: 'rtip',
                order: [
                  [2, 'desc']
                ],
                data: []
              })
          }),
        /* Promise 2: load python script */
        new Promise(function (resolve, reject) {
          Interface.initiate(panel, resolve, reject)
        })
      ]).then(function (value) {
        send(MSG.INIT_OK, value)
      })
        .catch(function (err) {
          send(MSG.FATAL_ERROR, err)
        })
    }

    var handleInitOK = function () {
      if (status === STATUS.NOT_READY) {
        if ($('#openpai-panel-recent-wrapper').is(':visible')) {
          /* if the panel has been shown, then load the cluster info */
          set(STATUS.READY_NOT_LOADING)
          send(MSG.CLICK_REFRESH)
        } else {
          /* if the panel has not been shown, change the status to READY_NOT_LOADING and wait */
          showInformation('')
          set(STATUS.READY_NOT_LOADING)
        }
      }
    }

    var handleAddJob = function (record) {
      Interface.add_job(record)
        .catch((e) => send(MSG.ERROR, e))
    }

    var handleRefresh = function () {
      if (status === STATUS.NOT_READY || status === STATUS.READY_LOADING) { return }
      if (status === STATUS.FATAL) {
        alert('Please refresh the whole page to reload this extension.')
        return
      }
      set(STATUS.READY_LOADING)
      var jobData
      Interface.get_jobs().then(
        function (data) {
          var ret = []
          jobData = data
          for (var i = 0; i < data.length; i += 1) {
            var record = data[i]
            var item = {
              jobname: record['jobname'],
              cluster: record['cluster'],
              vc: record['vc'],
              user: record['user'],
              time: record['time'],
              joblink: '<a href="' + record['joblink'] + '" target="_blank"><i class="fa fa-external-link openpai-table-button"></i></a>'
            }
            if (jobStatusFinished.indexOf(record['state']) >= 0) {
              item['state'] = record['state']
              if (record['form'] !== 'silent') { item['notebook_url'] = '-' } else {
                if ((record['notebook_url'] === undefined) || (record['notebook_url'] === '-')) { item['notebook_url'] = '-' } else { item['notebook_url'] = '<a data-path="' + record['notebook_url'] + '" href="#"><i class="silent-link item_icon notebook_icon icon-fixed-width openpai-table-button"></i></a>' }
              }
            } else {
              item['state'] = '<span class="datatable-status" data-jobname="' + record['jobname'] +
                      '" data-cluster="' + record['cluster'] + '" data-vc="' + record['vc'] +
                      '">' + Utils.getLoadingImgSmall() + '</span>'
              item['notebook_url'] = '<span class="datatable-notebook-url" data-jobname="' +
                      record['jobname'] + '" data-cluster="' + record['cluster'] +
                      '" data-vc="' + record['vc'] + '">' + Utils.getLoadingImgSmall() + '</span>'
            }
            ret.push(item)
          }
          $('#recent-jobs')
            .DataTable({
              dom: 'rtip',
              order: [
                [3, 'desc']
              ],
              data: ret,
              destroy: true,
              rowId: rowData => 'openpai-job-' + rowData['jobname'],
              columns: [{
                data: 'jobname',
                width: '15%'
              }, {
                data: 'cluster',
                width: '12%'
              }, {
                data: 'vc',
                width: '12%'
              }, {
                data: 'time',
                width: '25%'
              }, {
                data: 'state',
                width: '12%'
              }, {
                data: 'joblink',
                width: '12%'
              }, {
                data: 'notebook_url',
                width: '12%'
              }],
              initComplete: function () {
                set(STATUS.READY_LOADING)
                $('body').off('click', '.silent-link').on('click', '.silent-link', function (e) {
                  var url = $(e.target).parent().data('path')
                  Utils.copy_to_clipboard(url).then(
                    () => alert('The result file link has been copied to your clipboard! Please paste it to a new page.')
                  ).catch(
                    () => alert('Failed to copy the file link. Please find the file manually. Location: ' + url)
                  )
                })
                var jobsFinished = []
                var jobsUnfinished = []
                for (var item of jobData) {
                  if (jobStatusFinished.indexOf(item['state']) >= 0) { jobsFinished.push(item) } else { jobsUnfinished.push(item) }
                }
                /* Only detect unfinished jobs */
                Interface.detect_jobs(jobsUnfinished)
                  .then(function (jobsUnfinished) {
                    Interface
                      .save_jobs(jobsUnfinished.concat(jobsFinished))
                      .catch((e) => console.error(e)) // Although it is a promise, we don't care whether it succeeds or not.
                    for (var item of jobsUnfinished) {
                      var originalData = $('#recent-jobs').DataTable().row('#openpai-job-' + item['jobname']).data()
                      originalData['state'] = item['state']
                      if (item['notebook_url'] !== undefined && item['notebook_url'] !== '-') {
                        if (item['form'] === 'notebook') { originalData['notebook_url'] = '<a href="' + item['notebook_url'] + '" target="_blank"><i class="item_icon notebook_icon icon-fixed-width openpai-table-button"></i></a>' } else { originalData['notebook_url'] = '<a data-path="' + item['notebook_url'] + '" href="#"><i class="silent-link item_icon notebook_icon icon-fixed-width openpai-table-button"></i></a>' }
                      } else { originalData['notebook_url'] = '-' }
                      $('#recent-jobs').DataTable().row('#openpai-job-' + item['jobname']).data(originalData)
                    }
                    set(STATUS.SHOWING_INFO)
                  })
                  .catch(
                    function (e) {
                      console.error('[openpai submitter]', e)
                      set(STATUS.SHOWING_INFO)
                    }
                  )
              }
            }
            )
          $('#panel-recent-information-wrapper').hide()
          $('#panel-recent-table-wrapper').show()
        }
      ).catch((e) => send(MSG.ERROR, e))
    }

    var handleError = function (err) {
      showInformation(
        '<p>An error happened. ' +
                    'Please click [refresh] to retry. </p>' +
                    '<br><p>Error Information:' + err + '</p>'
      )
      set(STATUS.ERROR)
    }

    var handleFatalError = function (err) {
      showInformation(
        '<p>A fatal error happened and the OpenPAI Submitter has been terminated. ' +
                    'Please refresh the page and click Kernel - Restart & Clear Output to retry. </p>' +
                    '<br><p>Error Information:' + err + '</p>'
      )
      set(STATUS.FATAL)
    }

    var togglePanel = function (callback = null) {
      $('#openpai-panel-recent-wrapper').toggle(speed, callback)
    }

    var openPanel = function (callback = null) {
      $('#openpai-panel-recent-wrapper').show(speed, callback)
    }

    var closePanel = function (callback = null) {
      $('#openpai-panel-recent-wrapper').hide(speed, callback)
    }

    var bindPanel = function (panelInstance) {
      panel = panelInstance
    }

    return {
      send: send,
      STATUS: STATUS,
      MSG: MSG,
      bindPanel: bindPanel
    }
  }

  return Panel
})
