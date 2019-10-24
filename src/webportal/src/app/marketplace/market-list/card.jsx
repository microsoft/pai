import { getTheme } from '@uifabric/styling';
import styled from 'styled-components';

const { spacing, palette } = getTheme();

const Card = styled.div`
  padding: ${spacing.m};
  margin: ${spacing.m} 0;
  background: ${palette.white};
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px, rgba(0, 0, 0, 0.05) 0px 0.5px 1px;
`;

export default Card;
