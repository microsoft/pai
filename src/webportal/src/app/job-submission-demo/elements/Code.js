import styled from 'styled-components';
import { color, layout, typography } from 'styled-system';

const Code = styled('code')(
  {
    lineHeight: 'inherit',
    border: 0,
    padding: 0,
    margin: 0,
    whiteSpace: 'nowrap',
  },
  color,
  typography,
  layout,
);

export default Code;
