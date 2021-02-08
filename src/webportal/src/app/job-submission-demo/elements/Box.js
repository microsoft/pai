import styled from 'styled-components';
import { space, color, typography, layout, flexbox, border } from 'styled-system';

const Box = styled('div')(
  {
    boxSizing: 'border-box',
    minWidth: 0,
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif",
  },
  space,
  color,
  typography,
  layout,
  flexbox,
  border,
);

export default Box;
