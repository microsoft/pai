// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'office-ui-fabric-react';
import { Link } from '../../elements';
import styled from 'styled-components';

const HoverIcon = styled(Icon)({
  color: '#999',
  '&:hover': {
    color: 'black',
  },
});

export const TooltipIcon = ({ content }) => {
  return (
    <Link href={content} target='_blank' ml='s1'>
      <HoverIcon iconName='Info' />
    </Link>
  );
};

TooltipIcon.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
};
