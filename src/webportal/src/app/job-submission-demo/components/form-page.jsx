import React from 'react';
import { TooltipIcon } from './controls/tooltip-icon';
import { Box, Flex, Heading, Text } from '../elements';
import { Label } from 'office-ui-fabric-react';
import { isString } from 'lodash';

export const FormSection = ({ title, children, ...props }) => {
  return (
    <Flex flexDirection='column' bg='white' {...props}>
      <Box pl='l1' borderBottom='1px solid #f0f0f0'>
        {isString(title) ? (
          <Box pt='m' pb='m'>
            {title}
          </Box>
        ) : (
          title
        )}
      </Box>
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
