import c from 'classnames';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import {
  Stack,
  ColorClassNames,
  getTheme,
  StackItem,
  Text,
  FontSizes,
} from 'office-ui-fabric-react';
import React from 'react';

const { palette } = getTheme();

export const ResourceBar = ({ name, percentage, tailInfo, barHeight }) => {
  let barColor = palette.green;
  let fontColor = palette.black;
  if (percentage > 0.5) {
    barColor = palette.yellow;
  }
  if (percentage > 0.9) {
    barColor = palette.red;
  }

  if (percentage >= 1) {
    fontColor = palette.white;
  }

  const curBarHeigh = isNil(barHeight) ? '14px' : barHeight;

  return (
    <Stack horizontal gap='s1' styles={{ root: { height: curBarHeigh } }}>
      <StackItem styles={{ root: { width: 50 } }} align='center'>
        <Text variant='small'>{name}</Text>
      </StackItem>
      <StackItem grow styles={{ root: { position: 'relative' } }}>
        <Stack horizontal styles={{ root: { height: '100%', width: '100%' } }}>
          <StackItem grow={percentage * 100}>
            <div
              style={{
                backgroundColor: barColor,
                width: '100%',
                height: '100%',
              }}
            ></div>
          </StackItem>
          <StackItem grow={(1 - percentage) * 100}>
            <div
              className={c(ColorClassNames.neutralLightBackground)}
              style={{ width: '100%', height: '100%' }}
            />
          </StackItem>
        </Stack>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '98%',
            height: '100%',
            fontSize: FontSizes.small,
            color: fontColor,
            textAlign: 'right',
          }}
        >
          {tailInfo}
        </div>
      </StackItem>
    </Stack>
  );
};

ResourceBar.propTypes = {
  name: PropTypes.string,
  percentage: PropTypes.number.isRequired,
  tailInfo: PropTypes.string,
  barHeight: PropTypes.number,
};
