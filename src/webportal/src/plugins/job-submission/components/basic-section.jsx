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

import React, {useState} from 'react';
import {getId, Label, Stack, Text, Icon, StackItem} from 'office-ui-fabric-react';
import {FormSection} from './form-page';
import {getFormPageSytle, getFormBasicSectionStyle} from './form-style';
import PropTypes from 'prop-types';

const formPageStyle = getFormPageSytle();

export const BasicSection = (props) => {
  const {sectionLabel, sectionOptional, children} = props;
  const textFieldId = getId('textField');
  const basicSectionStyle = getFormBasicSectionStyle(sectionOptional);

  const [isSectionOn, setSectionOn] = useState(false);
  const [iconName, setIconName] = useState('CaretSolidRight');
  const onOpenItem = () => {
    if (isSectionOn) {
      setIconName('CaretSolidRight');
    } else {
      setIconName('CaretDown8');
    }
    setSectionOn(!isSectionOn);
  };

  return (
    <FormSection>
      <StackItem styles={formPageStyle.formFirstColumn}>
        <Stack horizontal gap='s2' wrap verticalAlign='center'>
          <StackItem>
            <Icon iconName={iconName} styles={basicSectionStyle.icon} onClick={onOpenItem}/>
          </StackItem>
          <StackItem>
            <Label htmlFor={textFieldId} styles={basicSectionStyle.label}>{sectionLabel}</Label>
          </StackItem>
          <StackItem>
            { sectionOptional && <Text styles={basicSectionStyle.optionalText}>Optional</Text>}
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem styles={formPageStyle.formSecondColunm}>
        <Stack gap='m'>
          {(!sectionOptional || isSectionOn) && children}
        </Stack>
      </StackItem>
    </FormSection>
  );
};

BasicSection.propTypes = {
  sectionLabel: PropTypes.string.isRequired,
  children: PropTypes.node,
  sectionOptional: PropTypes.bool,
};
