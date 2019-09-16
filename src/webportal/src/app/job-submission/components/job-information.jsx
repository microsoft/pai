/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormTextField } from './form-text-field';
import { FormPage } from './form-page';
import { FormSpinButton } from './form-spin-button';
import { VirtualCluster } from './virtual-cluster';
import Card from '../../components/card';
import { JobBasicInfo } from '../models/job-basic-info';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';

export const JobInformation = React.memo(
  ({ jobInformation, onChange, advanceFlag }) => {
    const { name, virtualCluster, jobRetryCount } = jobInformation;

    const onChangeProp = useCallback(
      (type, value) => {
        const updatedJobInfo = new JobBasicInfo({
          ...jobInformation,
          [type]: value,
        });
        onChange(updatedJobInfo);
      },
      [onChange, jobInformation],
    );

    const onNameChange = useCallback(name => onChangeProp('name', name), [
      onChangeProp,
    ]);

    const onVirtualClusterChange = useCallback(
      virtualCluster => onChangeProp('virtualCluster', virtualCluster),
      [onChangeProp],
    );

    const onRetryCountChange = useCallback(
      val => onChangeProp('jobRetryCount', val),
      [onChangeProp],
    );

    return (
      <Card>
        <FormPage>
          <FormTextField
            sectionLabel={'Job name'}
            sectionTooltip={PROTOCOL_TOOLTIPS.jobName}
            value={name}
            shortStyle
            onChange={onNameChange}
            placeholder='Enter job name'
          />
          <VirtualCluster
            onChange={onVirtualClusterChange}
            virtualCluster={virtualCluster}
          />
          {advanceFlag && (
            <FormSpinButton
              sectionOptional
              sectionLabel={'Retry count'}
              shortStyle
              value={jobRetryCount}
              onChange={onRetryCountChange}
            />
          )}
        </FormPage>
      </Card>
    );
  },
);

JobInformation.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  onChange: PropTypes.func.isRequired,
  advanceFlag: PropTypes.bool,
};
