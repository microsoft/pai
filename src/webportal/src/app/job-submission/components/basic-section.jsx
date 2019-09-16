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

import React, { useState } from 'react';
import {
  Label,
  Stack,
  Icon,
  StackItem,
  FontClassNames,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { FormSection } from './form-page';
import { getFormPageSytle, getFormBasicSectionStyle } from './form-style';
import { TooltipIcon } from './controls/tooltip-icon';

const formPageStyle = getFormPageSytle();

export const BasicSection = props => {
  const { sectionLabel, sectionOptional, sectionTooltip, children } = props;
  const basicSectionStyle = getFormBasicSectionStyle(sectionOptional);

  const [isSectionOn, setSectionOn] = useState(true);
  const onToggle = () => {
    setSectionOn(!isSectionOn);
  };

  return (
    <FormSection>
      <StackItem styles={formPageStyle.formFirstColumn}>
        <Stack horizontal gap='s1' verticalAlign='baseline'>
          <Icon
            iconName={isSectionOn ? 'CaretDown8' : 'CaretSolidRight'}
            styles={basicSectionStyle.icon}
            onClick={onToggle}
          />
          <StackItem grow>
            <div>
              <Stack horizontal gap='s1'>
                <Label styles={basicSectionStyle.label}>{sectionLabel}</Label>
                {sectionTooltip && <TooltipIcon content={sectionTooltip} />}
              </Stack>
              {sectionOptional && (
                <div className={FontClassNames.tiny}>Optional</div>
              )}
            </div>
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem styles={formPageStyle.formSecondColunm}>
        <Stack gap='m'>{(!sectionOptional || isSectionOn) && children}</Stack>
      </StackItem>
    </FormSection>
  );
};

BasicSection.defaultProps = {
  sectionLabel: '',
};

BasicSection.propTypes = {
  sectionLabel: PropTypes.string,
  sectionTooltip: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  children: PropTypes.node,
  sectionOptional: PropTypes.bool,
};
