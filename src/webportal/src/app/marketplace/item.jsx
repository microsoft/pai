import * as React from 'react';
import { getTheme, FontClassNames, IconFontSizes } from '@uifabric/styling';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';

import Card from './card';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

export const Item = ({ last }) => {
  const { spacing, palette } = getTheme();

  return (
    <Card style={{ padding: `0 ${spacing.l1}` }}>
      <Stack style={{ borderBottom: !last && '1px solid #eee' }} padding='l1 0'>
        <Stack horizontal horizontalAlign='space-between' gap='l2'>
          <Stack gap='l1'>
            <Stack horizontal gap='l1'>
              <div className={FontClassNames.xLarge}>Mnist</div>
              <Stack horizontal verticalAlign='center' gap='s2'>
                <Icon iconName='Like' />
                <div>10</div>
              </Stack>
            </Stack>
            <div>Author: mintao</div>
            <div>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Pellentesque nec nam aliquam sem et. Adipiscing elit ut aliquam
              purus sit amet. Egestas sed sed risus pretium quam vulputate. Ut
              diam quam nulla porttitor massa id. Aliquet nibh praesent
              tristique magna sit amet purus gravida quis. At consectetur lorem
              donec massa sapien faucibus et. Sollicitudin nibh sit amet commodo
              nulla. Vitae turpis massa sed elementum tempus. Iaculis at erat
              pellentesque adipiscing commodo elit at imperdiet. Ipsum faucibus
              vitae aliquet nec ullamcorper sit amet risus. Iaculis urna id
              volutpat lacus laoreet. In pellentesque massa placerat duis
              ultricies lacus. Vitae turpis massa sed elementum tempus egestas
              sed. Malesuada fames ac turpis egestas sed.
            </div>
            <Stack horizontal gap='s2' verticalAlign='center'>
              <div
                className={FontClassNames.small}
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${palette.neutralTertiary}`,
                  color: palette.neutralTertiary,
                  padding: spacing.s1,
                }}
              >
                tensorflow
              </div>
              <div
                className={FontClassNames.small}
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${palette.neutralTertiary}`,
                  color: palette.neutralTertiary,
                  padding: spacing.s1,
                }}
              >
                python
              </div>
              <div
                className={FontClassNames.small}
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${palette.neutralTertiary}`,
                  color: palette.neutralTertiary,
                  padding: spacing.s1,
                }}
              >
                文祥牛逼
              </div>
              <Icon
                styles={{
                  root: {
                    fontSize: IconFontSizes.large,
                    color: palette.neutralTertiary,
                  },
                }}
                iconName='AddTo'
              />
            </Stack>
          </Stack>
          <Stack gap='m'>
            <PrimaryButton>Edit</PrimaryButton>
            <PrimaryButton>Clone</PrimaryButton>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

Item.propTypes = {
  last: PropTypes.bool,
};
