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

import { FontClassNames, FontSizes } from '@uifabric/styling';
import c from 'classnames';
import { isEmpty } from 'lodash';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import PropTypes from 'prop-types';
import React from 'react';

import t from './tachyons.scss';

import { statusColor } from './theme';

export const Badge = ({ children, className }) => (
  <div className={c(FontClassNames.mediumPlus, className)}>{children}</div>
);

Badge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icons: PropTypes.array,
};

export const IconBadge = ({ children, className, icons, outerColor }) => (
  <Badge className={c(className)}>
    <div className={c(t.flex)}>
      {icons && (
        <div className={c(t.relative, t.w1)}>
          {icons.map((iconName, idx) => (
            <Icon
              key={`icon-${idx}-${iconName}`}
              className={c(t.absolute, t.absoluteFill)}
              styles={{
                root: {
                  color:
                    idx === 0 ? outerColor || statusColor.unknown : 'white',
                  fontSize: FontSizes.mediumPlus,
                },
              }}
              iconName={iconName}
            />
          ))}
        </div>
      )}
      <div
        className={c({ [t.ml3]: !isEmpty(icons) }, FontClassNames.mediumPlus)}
      >
        {children}
      </div>
    </div>
  </Badge>
);

IconBadge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  icons: PropTypes.array,
  outerColor: PropTypes.string,
};

export const SucceededBadge = ({ children }) => (
  <IconBadge
    icons={['StatusCircleOuter', 'StatusCircleCheckmark']}
    outerColor={statusColor.succeeded}
  >
    {children}
  </IconBadge>
);

SucceededBadge.propTypes = {
  children: PropTypes.node,
};

export const PrimaryBadge = ({ children }) => (
  <IconBadge
    icons={['StatusCircleOuter', 'StatusCircleCheckmark']}
    outerColor={statusColor.running}
  >
    {children}
  </IconBadge>
);

PrimaryBadge.propTypes = {
  children: PropTypes.node,
};

export const WaitingBadge = ({ children }) => (
  <IconBadge icons={['SkypeCircleClock']} outerColor={statusColor.waiting}>
    {children}
  </IconBadge>
);

WaitingBadge.propTypes = {
  children: PropTypes.node,
};

export const FailedBadge = ({ children }) => (
  <IconBadge
    icons={['StatusCircleOuter', 'StatusCircleErrorX']}
    outerColor={statusColor.failed}
  >
    {children}
  </IconBadge>
);

FailedBadge.propTypes = {
  children: PropTypes.node,
};

export const StoppedBadge = ({ children }) => (
  <IconBadge
    icons={['StatusCircleOuter', 'StatusCircleBlock2']}
    outerColor={statusColor.stopped}
  >
    {children}
  </IconBadge>
);

StoppedBadge.propTypes = {
  children: PropTypes.node,
};

export const UnknownBadge = ({ children }) => (
  <IconBadge
    icons={['StatusCircleOuter', 'StatusCircleQuestionMark']}
    outerColor={statusColor.unknown}
  >
    {children || 'Unknown'}
  </IconBadge>
);

UnknownBadge.propTypes = {
  children: PropTypes.node,
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Running':
      return <PrimaryBadge>{status}</PrimaryBadge>;
    case 'Stopping':
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
  status: PropTypes.oneOf([
    'Running',
    'Stopping',
    'Waiting',
    'Failed',
    'Succeeded',
    'Stopped',
    'Unknown',
  ]),
};

export default StatusBadge;
