// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { getTheme } from '@uifabric/styling';
import styled from 'styled-components';

const { palette } = getTheme();

const HorizontalLine = styled.hr`
  display: block;
  height: 1px;
  border: 0;
  border-top: 1px solid ${palette.neutralTertiaryAlt};
  margin: 1px 0;
  padding: 0;
`;

export default HorizontalLine;
