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

import {FontClassNames} from '@uifabric/styling';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../tachyons.css';

export const Badge = ({children, className}) => (
  <div className={classNames(t.center, FontClassNames.small, t.w4, t.pv1, t.tc, className)}>
    {children}
  </div>
);

Badge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export const SuccessBadge = ({children}) => (
  <Badge className={classNames(t.white, t.bgGreen)}>
    {children}
  </Badge>
);

SuccessBadge.propTypes = {
  children: PropTypes.node,
};

export const PrimaryBadge = ({children}) => (
  <Badge className={classNames(t.white, t.bgBlue)}>
    {children}
  </Badge>
);

PrimaryBadge.propTypes = {
  children: PropTypes.node,
};

export const WarningBadge = ({children}) => (
  <Badge className={classNames(t.black, t.bgGold)}>
    {children}
  </Badge>
);

WarningBadge.propTypes = {
  children: PropTypes.node,
};

export const DangerBadge = ({children}) => (
  <Badge className={classNames(t.white, t.bgDarkRed)}>
    {children}
  </Badge>
);

DangerBadge.propTypes = {
  children: PropTypes.node,
};

export const DefaultBadge = ({children}) => (
  <Badge className={classNames(t.white, t.bgGray)}>
    {children}
  </Badge>
);

DefaultBadge.propTypes = {
  children: PropTypes.node,
};

export const StatusBadge = ({status}) => {
  switch (status) {
    case 'Running':
      return <PrimaryBadge>{status}</PrimaryBadge>;
    case 'Stopping':
    case 'Waiting':
      return <WarningBadge>{status}</WarningBadge>;
    case 'Failed':
      return <DangerBadge>{status}</DangerBadge>;
    case 'Succeeded':
      return <SuccessBadge>{status}</SuccessBadge>;
    case 'Stopped':
    case 'Unknown':
      return <DefaultBadge>{status}</DefaultBadge>;
    default:
      return <DefaultBadge>{status}</DefaultBadge>;
  }
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['Running', 'Stopping', 'Waiting', 'Failed', 'Succeeded', 'Stopped', 'Unknown']),
};


export default StatusBadge;
