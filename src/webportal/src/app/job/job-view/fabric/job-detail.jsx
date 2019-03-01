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

import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import {initializeIcons} from '@uifabric/icons';

import t from './tachyons.css';

import Top from './components/top';
import Summary from './components/summary';
import Loading from './components/loading';
import {FontClassNames} from '@uifabric/styling';

import config from '../../../config/webportal.config';

initializeIcons();

function getParams() {
  return new URLSearchParams(window.location.search);
}

class JobDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobInfo: null,
    };
  }

  componentDidMount() {
    const param = getParams();
    const namespace = param.get('username');
    const jobName = param.get('jobName');
    const url = namespace
      ? `${config.restServerUri}/api/v1/user/${namespace}/jobs/${jobName}`
      : `${config.restServerUri}/api/v1/jobs/${jobName}`;
    void fetch(url).then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        this.setState({jobInfo: json});
      } else {
        const json = await res.json();
        alert(json.message);
      }
    }).catch((e) => {
      alert(e);
    });
  }

  render() {
    const {jobInfo} = this.state;
    if (!jobInfo) {
      return <Loading />;
    } else {
      return (
        <div className={classNames(t.w100, t.ph4, t.pv3, FontClassNames.medium)}>
          <Top />
          <Summary className={t.mt3} jobInfo={jobInfo} />
        </div>
      );
    }
  }
}

ReactDOM.render(<JobDetail />, document.getElementById('content-wrapper'));
