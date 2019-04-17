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

import c from 'classnames';
import {isEmpty} from 'lodash';
import {Link, FontClassNames, PrimaryButton, DefaultButton, Stack} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

import Card from './card';
import {theme} from '../../components/theme';

import t from '../../components/tachyons.css';

const Header = ({jobs}) => (
  <div className={c(t.flex, t.justifyBetween)}>
    <div>
      My rencent jobs
    </div>
    {!isEmpty(jobs) && (
      <div>
        <Link href='/job-list.html'>More</Link>
      </div>
    )}
  </div>
);

Header.propTypes = {
  jobs: PropTypes.array.isRequired,
};

const DummyContent = () => (
  <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
    <div className={c(t.overflowAuto, t.w100)} style={{maxHeight: '100%', padding: theme.spacing['m']}}>
      <div className={c(t.tc, FontClassNames.mediumPlus)}>
        No rencent resources to display
      </div>
      <div className={c(t.tc, FontClassNames.mediumPlus)} style={{marginTop: theme.spacing['l1']}}>
        {`As you visit jobs, they'll be listed in Recently used jobs for quick and easy access.`}
      </div>
      <Stack
        styles={{root: [{marginTop: theme.spacing['l1']}]}}
        horizontal
        horizontalAlign='center'
        gap='s1'
      >
        <Stack.Item>
          <PrimaryButton
            styles={{root: [{width: 120}]}}
            text='Create a job'
            href='submit.html'
          />
        </Stack.Item>
        <Stack.Item>
          <DefaultButton
            text='Tutorial'
            styles={{root: [{width: 120}]}}
            href='https://github.com/Microsoft/pai/blob/master/docs/user/training.md'
            target='_blank'
          />
        </Stack.Item>
      </Stack>
    </div>
  </div>
);

const Content = ({jobs}) => {
  if (true && isEmpty(jobs)) {
    return <DummyContent />;
  } else {
    return (
      <DummyContent />
    );
  }
};

const RecentJobList = ({className, jobs}) => {
  return (
    <Card className={c(t.h100)}>
      <Stack styles={{root: [t.h100]}}>
        <Stack.Item>
          <Header jobs={jobs} />
        </Stack.Item>
        <Stack.Item styles={{root: [{height: 0}]}} grow>
          <Content jobs={jobs} />
        </Stack.Item>
      </Stack>
    </Card>
  );
};

RecentJobList.propTypes = {
  className: PropTypes.string,
  jobs: PropTypes.array.isRequired,
};

export default RecentJobList;
