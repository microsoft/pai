import React from 'react';
import { IconButton } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

export const TooltipIcon = ({ content }) => {
  return (
    <IconButton
      target='_blank'
      iconProps={{ iconName: 'Info' }}
      href={content}
    />
  );
};

TooltipIcon.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
};
