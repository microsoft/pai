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

import {FontClassNames, ColorClassNames, mergeStyles} from '@uifabric/styling';
import c from 'classnames';
import {isEmpty} from 'lodash';
import {Icon} from 'office-ui-fabric-react/lib/Icon';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../tachyons.css';

export const Badge = ({children, className}) => (
  <div className={c(FontClassNames.medium, mergeStyles({width: '10rem', padding: '0.75rem 1rem'}), className)}>
    {children}
  </div>
);

Badge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icons: PropTypes.array,
};

export const IconBadge = ({children, className, icons}) => (
  <Badge className={c(className)}>
    <div className={c(t.flex)}>
      {
        icons && <div className={c(t.relative, t.w1)}>
        {
          icons.map((iconName, idx) => (
            <Icon key={`icon-${idx}-${iconName}`} className={c(t.absolute, t.absoluteFill)} iconName={iconName} />
          ))
        }
        </div>
      }
      <div className={c({[t.ml3]: !isEmpty(icons)})}>{children}</div>
    </div>
  </Badge>
);

IconBadge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icons: PropTypes.array,
};

export const SucceededBadge = ({children}) => (
  <IconBadge
    className={c(mergeStyles({backgroundColor: '#7fba00'}), t.white)}
    icons={['StatusCircleRing', 'StatusCircleCheckmark']}
  >
    {children}
  </IconBadge>
);

SucceededBadge.propTypes = {
  children: PropTypes.node,
};

export const PrimaryBadge = ({children}) => (
  <IconBadge
    className={c(t.white, ColorClassNames.blueBackground)}
    icons={['StatusCircleRing', 'StatusCircleCheckmark']}
  >
    {children}
  </IconBadge>
);

PrimaryBadge.propTypes = {
  children: PropTypes.node,
};

export const WaitingBadge = ({children}) => (
  <IconBadge
    className={c(t.black, ColorClassNames.yellowBackground)}
    icons={['Clock']}
  >
    {children}
  </IconBadge>
);

WaitingBadge.propTypes = {
  children: PropTypes.node,
};

export const FailedBadge = ({children}) => (
  <IconBadge
    className={c(t.white, ColorClassNames.redBackground)}
    icons={['StatusCircleRing', 'StatusCircleErrorX']}
  >
    {children}
  </IconBadge>
);

FailedBadge.propTypes = {
  children: PropTypes.node,
};

export const StoppedBadge = ({children}) => (
  <IconBadge
    className={c(t.white, ColorClassNames.redBackground)}
    icons={['StatusCircleRing', 'StatusCircleBlock2']}
  >
    {children}
  </IconBadge>
);

StoppedBadge.propTypes = {
  children: PropTypes.node,
};

export const UnknownBadge = ({children}) => (
  <IconBadge
    className={c(t.white, ColorClassNames.neutralSecondaryBackground)}
    icons={['StatusCircleRing', 'StatusCircleQuestionMark']}
  >
    {children}
  </IconBadge>
);

UnknownBadge.propTypes = {
  children: PropTypes.node,
};

export const StatusBadge = ({status}) => {
  switch (status) {
    case 'Running':
    case 'Stopping':
      return <PrimaryBadge>{status}</PrimaryBadge>;
    case 'Waiting':
      return <WaitingBadge>{status}</WaitingBadge>;
    case 'Failed':
      return <FailedBadge>{status}</FailedBadge>;
    case 'Succeeded':
      return <SucceededBadge>{status}</SucceededBadge>;
    case 'Stopped':
      return <StoppedBadge>{status}</StoppedBadge>;
    case 'Unknown':
      return <UnknownBadge>{status}</UnknownBadge>;
    default:
      return <UnknownBadge>{status}</UnknownBadge>;
  }
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['Running', 'Stopping', 'Waiting', 'Failed', 'Succeeded', 'Stopped', 'Unknown']),
};


export default StatusBadge;
