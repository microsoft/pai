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

import React, {useCallback} from 'react';
import {Text, Stack, IconButton, TooltipHost} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {FormTextField} from './form-text-field';
import {FormPage} from './form-page';
import {FormSpinButton} from './form-spin-button';
import {VirtualCluster} from './virtual-cluster';
import Card from '../../components/card';
import {JobBasicInfo} from '../models/job-basic-info';

export const JobInformation = React.memo(({jobInformation, onChange, advanceFlag}) => {
  const {name, virtualCluster, jobRetryCount} = jobInformation;

  const onChangeProp = useCallback(
    (type, value) => {
      const updatedJobInfo = new JobBasicInfo({...jobInformation, [type]: value});
      onChange(updatedJobInfo);
    },
    [onChange, jobInformation],
  );

  const onNameChange = useCallback(
    (name) => onChangeProp('name', name),
    [onChangeProp],
  );

  const onVirtualClusterChange = useCallback(
    (virtualCluster) => onChangeProp('virtualCluster', virtualCluster),
    [onChangeProp],
  );

  const onRetryCountChange = useCallback(
    (val) => onChangeProp('retryCount', val),
    [onChangeProp]
  );

  return (
    <Card>
      <FormPage>
        <Stack horizontal verticalAlign='baseline'>
          <Text variant='xLarge' styles={{root: {fontWeight: 'semibold'}}}>
            Job Information
          </Text>
          <TooltipHost
            calloutProps={{
              isBeakVisible: false,
              gapSpace: 8, // spacing.s1
            }}
            content='Click to open job help page'
          >
            <IconButton
              iconProps={{iconName: 'HintText'}}
              styles={{root: {height: '100%'}}}
              href='https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml'
              target='_blank'
              text='asdasdads'
            />
          </TooltipHost>
        </Stack>
        <FormTextField
          sectionLabel={'Job name'}
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
});

JobInformation.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  onChange: PropTypes.func.isRequired,
  advanceFlag: PropTypes.bool,
};
