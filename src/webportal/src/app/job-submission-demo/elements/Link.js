import styled from 'styled-components';
import { space, color, layout, flexbox, border } from 'styled-system';

const Link = styled('a')(
  { cursor: 'pointer', userSelect: 'none' },
  space,
  color,
  layout,
  border,
);

export default Link;
