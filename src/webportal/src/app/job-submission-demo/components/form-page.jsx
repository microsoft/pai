import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { TooltipIcon } from './controls/tooltip-icon';
import { Box, Flex } from '../elements';
import { isString } from 'lodash';
import PropTypes from 'prop-types';

export const FormSection = ({ title, children, tooltip, ...props }) => {
  return (
    <Flex flexDirection='column' bg='white' {...props}>
      <Flex alignItems='center' pl='m' borderBottom='1px solid #f0f0f0'>
        {isString(title) ? (
          <Box pt='m' pb='m' fontSize='m'>
            {title}
          </Box>
        ) : (
          title
        )}
        {tooltip && <TooltipIcon content={tooltip} />}
      </Flex>
      <Box p='l1'>{children}</Box>
    </Flex>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
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
