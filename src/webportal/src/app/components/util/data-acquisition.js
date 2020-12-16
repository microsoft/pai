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
import config from '../../config/webportal.config';

let dataAcquisition = {
  //configuration items
  store: {
    storeInput: 'ACINPUT',
    storePage: 'ACPAGE',
    storeClick: 'ACCLIK',
    storeTiming: 'ACTIME',
    sendUrl: config.usageStatisticUri,
    selector: 'input',
    acRange: ['text', 'radio'],
    classTag: '',
    maxDays: 7,
    acbLength: 0,
    useStorage: false,
    openInput: true,
    openClick: true,
  },

  util: {
    isNullOrEmpty: function(obj) {
      return ( obj !== 0 || obj !== '0' ) && ( obj === undefined || typeof obj === 'undefined' || obj === null || obj === 'null' || obj === '' );
    },

    setCookie: function(name, value, Day) {
      if (dataAcquisition.store.useStorage) {
        window.localStorage.setItem(name, value);
      } else {
        if (!Day) Day = dataAcquisition.store.maxDays;
        let exp = new Date();
        exp.setTime(exp.getTime() + Day * 24 * 60 * 60000);
        document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + exp.toUTCString() + ';path=/';
      }
    },

    getCookie: function(name) {
      let arr = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
      let reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
      if (!name) return null;
      if (dataAcquisition.store.useStorage) {
        return window.localStorage.getItem(name);
      } else {
        if (arr = document.cookie.match(reg)) {
          return (decodeURIComponent(arr[2]));
        } else {
          return null;
        }
      }
    },

    delCookie: function(name) {
      if (dataAcquisition.store.useStorage) {
        window.localStorage.removeItem(name);
      } else {
        this.setCookie(name, '', -1);
      }
    },

    getUserName: function() {
      const userName = cookies.get('user');
      return userName;
    },

    getTimeStr: function() {
      let date = new Date();
      let now = date.getFullYear() + '/';
      now += (date.getMonth() + 1) + '/';
      now += date.getDate() + ' ';
      now += date.getHours() + ':';
      now += date.getMinutes() < 10 ? ('0' + date.getMinutes() + ':') : (date.getMinutes() + ':');
      now += date.getSeconds() < 10 ? ('0' + date.getSeconds() + '') : (date.getSeconds() + '');
      return now;
    },

    getOwnInnerText(node) {
      let firstChild = node.firstChild;
      let texts = [];
      while (firstChild) {
        // filter out icon text (firstChild.data.length > 1)
        if (firstChild.nodeType == 3 && firstChild.data.length > 1) {
          texts.push(firstChild.data);
        }
        firstChild = firstChild.nextSibling;
      }
      var text = texts.join("");
      return text;
    }
  },

  init: function() {
    let _this = this;

    setTimeout(() => {
      let _ACIDoms = document.querySelectorAll(this.store.selector);
      this.store.useStorage = (typeof window.localStorage != 'undefined');
      this.util.setCookie(this.store.storePage, window.location.pathname);
      this.postData();

      // input event listening
      if (this.store.openInput) {
        for (let i = 0; i < _ACIDoms.length; i++) {
          let selector = _ACIDoms[i];
          if (selector.type && dataAcquisition.store.acRange.indexOf(selector.type.toLowerCase()) > -1) {
            selector.addEventListener('blur', function() {
              dataAcquisition.setInputAc(this);
            });
          }
        }
      }

      // click event listening
      if (this.store.openClick) {
        document.addEventListener('click', function(e) {
          let event = window.event || e;
          let target = event.srcElement ? event.srcElement : event.target;
          _this.getACBTarget(target);
        },
          true
        );
      }
    }, 5000)

    return this;
  },

  setInputAc: function(e) {
    // input operates data saving
    if (this.util.isNullOrEmpty(e.value)) {
      return;
    }
    let storeString = this.util.getCookie(this.store.storeInput);
    let elementId = e.id;
    let className = e.className;
    let storeKey = '#' + elementId + '|' + className; //same element is not added repeatedly
    let ACIData = this.util.isNullOrEmpty(storeString) ? {} : JSON.parse(storeString);
    let inputData = ACIData[storeKey];
    
    // existing data should not be added
    let nowStr = this.util.getTimeStr();

    if (this.util.isNullOrEmpty(inputData)) {
      inputData = {};
      inputData.type = this.store.storeInput;
      inputData.path = this.util.getCookie(this.store.storePage);
      inputData.eId = elementId;
      inputData.className = className;
      inputData.val = e.value || e.innerText;
      inputData.sTme = nowStr;
      inputData.eTme = nowStr;
    } else {
      if (inputData.val !== e.value) {
        inputData.val += (',' + e.value);
      }
      inputData.eTme = nowStr;
    }
    ACIData[storeKey] = inputData;
    this.util.setCookie(this.store.storeInput, JSON.stringify(ACIData));
  },

  // click operates data saving
  setClickAc: function(e) {
    // active burial takes effect
    if (!this.util.isNullOrEmpty(this.store.classTag) && e.className.indexOf(this.store.classTag) < 0) {
      return;
    }
    let innerText = this.util.getOwnInnerText(e);
    if (this.util.isNullOrEmpty(innerText)) {
      return;
    }
    let storeString = this.util.getCookie(this.store.storeClick);
    let ACBData = this.util.isNullOrEmpty(storeString) ? [] : JSON.parse(storeString);
    let nowStr = this.util.getTimeStr();
    
    let clickData = {
      type: this.store.storeClick,
      path: this.util.getCookie(this.store.storePage),
      eId: e.id,
      className: e.className,
      val: innerText ,
      sTme: nowStr,
      eTme: nowStr
    };

    ACBData.push(clickData);
    this.util.setCookie(this.store.storeClick, JSON.stringify(ACBData));
  },

  getAc2Type: function(type) {
    // get local data
    let storeArr = [];
    let storeString = this.util.getCookie(type);
    if (!this.util.isNullOrEmpty(storeString)) {
      storeArr = JSON.parse(storeString);
    }
    this.util.delCookie(type);
    return storeArr;
  },

  getACBTarget: function(node, length) {
    if (this.util.isNullOrEmpty(length)) {
      length = 0;
    }
    if (!this.util.isNullOrEmpty(node)) {
      this.setClickAc(node);
      let parentNode = node && node.parentNode;
      if (Object.prototype.toString.call(parentNode) !== Object.prototype.toString.call(document) && length < this.store.acbLength) {
        this.getACBTarget(parentNode, ++length);
      }
    }
  },

  postData: function() {
    let _this = this;
    let data = [];
    let storePath = window.location.pathname;
    let nowStr = this.util.getTimeStr();
    let inputAcData = this.getAc2Type(this.store.storeInput);
    let clickAcData = this.getAc2Type(this.store.storeClick);
    let timingAcData = this.getAc2Type(this.store.storeTiming);
    let userName = this.util.getUserName();

    //reported data
    data.push({'type': this.store.storePage, 'path': storePath, 'sTme': nowStr, 'eTme': nowStr});
    if (!_this.util.isNullOrEmpty(inputAcData)) {
      for (let key in inputAcData) {
        data.push(inputAcData[key]);
      }
    }
    data = data.concat(clickAcData, timingAcData);

    this._ajax({
      type: 'POST',
      url: _this.store.sendUrl,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({uuid: userName, acData: data}),
    });
  },

  _ajax: function(options) {
    let xhr;
    let params;
    options = options || {};
    options.type = (options.type || 'GET').toUpperCase();
    options.dataType = (options.dataType || 'json');
    options.async = (options.async || true);
    if (options.data) {
      params = options.data;
    }

    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
      if (xhr.overrideMimeType) {
        xhr.overrideMimeType('text/xml');
      }
    } else {
      xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }

    if (options.type == 'GET') {
      xhr.open('GET', options.url + '?' + params, options.async);
      xhr.send(null);
    } else if (options.type == 'POST') {
      xhr.open('POST', options.url, options.async);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      if (params) {
        xhr.send(params);
      } else {
        xhr.send();
      }
    }
  }
};

$(document).ready(function(){
  dataAcquisition.init();
});
