import React from 'react';
import { TooltipIcon } from '../controls/tooltip-icon';
import { Box, Flex, Text } from '../../elements';

export const SidebarCard = ({ title, tooltip, selected, children }) => {
  return (
    <Box>
      <Flex alignItems='baseline' mb='m'>
        <Text fontSize='m' fontWeight='bold' color='black-80' lineHeight={0}>
          {title}
        </Text>
        {tooltip && <TooltipIcon content={tooltip} />}
      </Flex>
      {children}
    </Box>
  );
};
