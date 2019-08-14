import c from 'classnames';
import PropTypes from 'prop-types';
import {isNil} from 'lodash';
import {
  Stack,
  ColorClassNames,
  getTheme,
  StackItem,
  Text,
  FontSizes,
} from 'office-ui-fabric-react';
import React from 'react';

const {spacing, palette} = getTheme();

export const ResourceBar = ({name, percentage, tailInfo, barHeight}) => {
  let barColor = palette.green;
  if (percentage > 0.1) {
    barColor = palette.yellow;
  } else if (percentage > 0.9) {
    barColor = palette.red;
  }

  const curBarHeigh = isNil(barHeight) ? '14px': barHeight;

  return (
    <Stack horizontal gap="s1" styles={{root: {height: curBarHeigh}}}>
      <StackItem styles={{root: {width: 50}}} align='center'>
        <Text variant={FontSizes.xSmall}>{name}</Text>
      </StackItem>
      <StackItem grow>
        <Stack horizontal styles={{root: {height: '100%', width: '100%'}}}>
          <StackItem grow={percentage * 100}>
            <div
              style={{
                backgroundColor: barColor,
                width: '100%',
                height: '100%',
              }}
            />
            </StackItem>
            <StackItem grow={(1 - percentage) * 100}>
            <div
              className={c(ColorClassNames.neutralLightBackground)}
              style={{width: '100%', textAlign: 'right', height: '100%', fontSize: FontSizes.small, color: palette.black}}
            >
              {tailInfo}
            </div>
            </StackItem>
          </Stack>
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

