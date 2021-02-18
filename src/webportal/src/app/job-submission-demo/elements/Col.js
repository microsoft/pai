import styled from 'styled-components';
import { flexbox, system } from 'styled-system';

const Col = styled('div')(
  system({
    span: {
      properties: ['flexBasis', 'maxWidth'],
      transform: (value, scale) => {
        return `${(value / 12) * 100}%`;
      },
    },
  }),
  flexbox,
);

export default Col;
