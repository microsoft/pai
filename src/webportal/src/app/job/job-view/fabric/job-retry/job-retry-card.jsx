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

import { FontClassNames, ColorClassNames, getTheme } from '@uifabric/styling';
import c from 'classnames';
import { Stack, IconButton, Link } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Interval, DateTime } from 'luxon';
import { capitalize, isNil } from 'lodash';

import Card from '../../../../components/card';
import { getDurationString } from '../../../../components/util/job';
import StatusBadge from '../../../../components/status-badge';
import { ContainerList } from './container-list';
import { printDateTime } from '../job-detail/util';
import MonacoPanel from '../../../../components/monaco-panel';

const { spacing } = getTheme();

function getAttemptDurationString(attempt) {
  const start =
    attempt.attemptStartedTime &&
    DateTime.fromMillis(attempt.attemptStartedTime);
  const end = attempt.attemptCompletedTime
    ? DateTime.fromMillis(attempt.attemptCompletedTime)
    : DateTime.utc();
  if (start && end) {
    return getDurationString(
      Interval.fromDateTimes(start, end || DateTime.utc()).toDuration([
        'days',
        'hours',
        'minutes',
        'seconds',
      ]),
    );
  } else {
    return 'N/A';
  }
}

const TaskRole = ({ name, taskrole }) => {
  return (
    <Stack gap='s1'>
      <div
        className={c(FontClassNames.medium)}
        style={{ marginRight: spacing.l1 }}
      >
        <span style={{ marginRight: spacing.s1 }}>TaslRole Name:</span>
        <span>{name}</span>
      </div>
      <ContainerList taskStatuses={taskrole.taskStatuses} />
    </Stack>
  );
};

TaskRole.propTypes = {
  name: PropTypes.string,
  taskrole: PropTypes.object,
};

export const JobRetryCard = ({ jobRetry }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [monacoProps, setMonacoProps] = useState(null);
  const [modalTitle, setModalTile] = useState('');

  const showEditor = (title, props) => {
    setMonacoProps(props);
    setModalTile(title);
  };

  const dismissEditor = () => {
    setMonacoProps(null);
    setModalTile('');
  };

  const showExitDiagnostics = () => {
    const result = [];

    // diagnostics
    const diag = jobRetry.diagnosticsSummary;
    if (diag) {
      // content
      result.push('[Diagnostics]');
      result.push('');
      result.push(diag);
      result.push('');
    }

    showEditor('Diagnostics', {
      language: 'text',
      value: result.join('\n'),
    });
  };

  return (
    <Card>
      <Stack>
        <Stack
          horizontal
          horizontalAlign='space-between'
          verticalAlign='baseline'
        >
          <Stack horizontal verticalAlign='center' gap='l1'>
            <div
              className={c(FontClassNames.large)}
              style={{ marginRight: spacing.l1 }}
            >
              <span style={{ marginRight: spacing.s1 }}>Retry Index:</span>
              <span>{jobRetry.attemptIndex}</span>
            </div>
            <StatusBadge status={capitalize(jobRetry.state)} />
          </Stack>
          <div>
            {isExpanded ? (
              <IconButton
                iconProps={{ iconName: 'ChevronUp' }}
                onClick={() => setIsExpanded(false)}
              />
            ) : (
              <IconButton
                iconProps={{ iconName: 'ChevronDown' }}
                onClick={() => setIsExpanded(true)}
              />
            )}
          </div>
        </Stack>
        <Stack
          horizontal
          verticalAlign='baseline'
          gap='l1'
          styles={{ root: { marginBottom: spacing.l1 } }}
        >
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Start Time:
            </div>
            <div className={c(FontClassNames.mediumPlus)}>
              {printDateTime(DateTime.fromMillis(jobRetry.attemptStartedTime))}
            </div>
          </div>
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Duration:
            </div>
            <div className={c(FontClassNames.mediumPlus)}>
              {getAttemptDurationString(jobRetry)}
            </div>
          </div>
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Exit Code:
            </div>
            <div className={c(FontClassNames.mediumPlus)}>
              {`${jobRetry.exitCode}`}
            </div>
          </div>
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Exit Phrase:
            </div>
            <div className={c(FontClassNames.mediumPlus)}>
              {`${jobRetry.exitPhrase}`}
            </div>
          </div>
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Exit Type:
            </div>
            <div className={c(FontClassNames.mediumPlus)}>
              {`${jobRetry.exitType}`}
            </div>
          </div>
          <div>
            <div
              className={c(
                FontClassNames.medium,
                ColorClassNames.neutralSecondary,
              )}
              style={{ marginBottom: spacing.s1 }}
            >
              Diagnostics:
            </div>
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              href='#'
              disabled={isNil(jobRetry.diagnosticsSummary)}
              onClick={showExitDiagnostics}
            >
              View Diagnostics
            </Link>
          </div>
        </Stack>
        <Stack gap='m'>
          {isExpanded &&
            Object.keys(jobRetry.taskRoles).map(name => (
              <TaskRole
                key={name}
                name={name}
                taskrole={jobRetry.taskRoles[name]}
              />
            ))}
        </Stack>
      </Stack>
      <MonacoPanel
        isOpen={!isNil(monacoProps)}
        onDismiss={dismissEditor}
        title={modalTitle}
        monacoProps={monacoProps}
      />
    </Card>
  );
};

JobRetryCard.propTypes = {
  jobRetry: PropTypes.object,
};
