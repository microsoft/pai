import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { TooltipIcon } from './controls/tooltip-icon';
import { Box, Flex, Text } from '../elements';
import { isString } from 'lodash';

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

export const FormItem = ({ children, label, name, tooltip }) => {
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
