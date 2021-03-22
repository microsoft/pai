// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { TooltipIcon } from './controls/tooltip-icon';
import { Box, Flex } from '../elements';
import PropTypes from 'prop-types';

export const FormSection = ({ title, extra, children, tooltip, ...props }) => {
  return (
    <Flex
      bg='white'
      borderBottom='1px solid #f0f0f0'
      flexDirection='column'
      {...props}
    >
      <Flex flexDirection='column'>
        <Box p='m' fontSize='s1' borderBottom='1px solid #f0f0f0'>
          {title}
          {tooltip && <TooltipIcon content={tooltip} />}
        </Box>
        <Box pl='s1' borderBottom='1px solid #f0f0f0'>
          {extra}
        </Box>
      </Flex>
      <Box p='m'>{children}</Box>
    </Flex>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
  extra: PropTypes.node,
  children: PropTypes.node,
  tooltip: PropTypes.string,
};

export const FormItem = ({ children, label, tooltip }) => {
  return (
    <Box mb='l1'>
      <Flex alignItems='center' mb='s2'>
        <Label>{label}</Label>
        {tooltip && <TooltipIcon content={tooltip} />}
      </Flex>
      {children}
    </Box>
  );
};

FormItem.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
  tooltip: PropTypes.string,
};
