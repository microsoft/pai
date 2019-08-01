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

import { FontClassNames, FontWeights } from '@uifabric/styling';
import c from 'classnames';
import { Link } from 'office-ui-fabric-react';
import React from 'react';

import t from 'tachyons-sass/tachyons.scss';

const Bottom = () => (
  <div className={c(t.bgWhite, t.pt5, t.pb6, t.ph6, t.flexL)}>
    <div
      className={c(
        t.w33L,
        t.w100,
        t.tc,
        t.flex,
        t.flexColumn,
        t.itemsCenter,
        t.justifyBetween,
      )}
    >
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div
          className={c(FontClassNames.xxLarge)}
          style={{ fontWeight: FontWeights.semibold }}
        >
          Submit a hello-world job
        </div>
        <div
          className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)}
          style={{ maxWidth: '20rem' }}
        >
          With submitting a hello-world job, this section introduces more
          knowledge about job, so that you can write your own job configuration
          easily.
        </div>
      </div>
      <Link
        href='https://github.com/microsoft/pai/blob/master/docs/user/job_submission.md'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Learn more
      </Link>
    </div>
    <div
      className={c(
        t.w33L,
        t.w100,
        t.mt0L,
        t.mt5,
        t.tc,
        t.ph4,
        t.flex,
        t.flexColumn,
        t.itemsCenter,
        t.justifyBetween,
      )}
    >
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div
          className={c(FontClassNames.xxLarge)}
          style={{ fontWeight: FontWeights.semibold }}
        >
          Understand Job
        </div>
        <div
          className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)}
          style={{ maxWidth: '20rem' }}
        >
          The job of OpenPAI defines how to execute command(s) in specified
          environment(s). A job can be model training, other kinds of commands,
          or distributed on multiple servers.
        </div>
      </div>
      <Link
        href='https://github.com/microsoft/pai/blob/master/docs/user/job_submission.md#learn-the-hello-world-job'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Learn more
      </Link>
    </div>
    <div
      className={c(
        t.w33L,
        t.w100,
        t.mt0L,
        t.mt5,
        t.tc,
        t.flex,
        t.flexColumn,
        t.itemsCenter,
        t.justifyBetween,
      )}
    >
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div
          className={c(FontClassNames.xxLarge)}
          style={{ fontWeight: FontWeights.semibold }}
        >
          Use VS Code Extension to work with Jobs
        </div>
        <div
          className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)}
          style={{ maxWidth: '20rem' }}
        >
          OpenPAI Client is a VS Code extension to connect PAI clusters, submit
          AI jobs, and manage files on HDFS, etc. You need to install the
          extension in VS code before using it.
        </div>
      </div>
      <Link
        href='https://github.com/Microsoft/pai/blob/master/contrib/pai_vscode/VSCodeExt.md'
        target='_blank'
        style={{ fontWeight: FontWeights.semibold }}
      >
        Learn more
      </Link>
    </div>
  </div>
);

export default Bottom;
