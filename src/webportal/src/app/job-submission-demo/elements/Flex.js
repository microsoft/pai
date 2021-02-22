// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import styled from 'styled-components';
import { space, color, layout, flexbox, border } from 'styled-system';

const Flex = styled('div')(
  {
    display: 'flex',
  },
  space,
  color,
  layout,
  flexbox,
  border,
);

export default Flex;
