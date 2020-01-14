import PropTypes from 'prop-types';
import React, { useCallback, useContext } from 'react';
import {
  Text,
  Stack,
  DefaultButton,
  PrimaryButton,
  TooltipHost,
  FontWeights,
} from 'office-ui-fabric-react';
import { getTheme, FontClassNames } from '@uifabric/styling';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { isNil } from 'lodash';
import yaml from 'js-yaml';

import { TagBar } from '../../components/tag-bar';
import Card from './card';
import Context from '../Context';

const { spacing } = getTheme();

const ItemCard = props => {
  const { item } = props;

  const { history } = useContext(Context);

  const clickSubmit = useCallback(() => {
    // save jobConfig to localStorage
    window.localStorage.removeItem('marketItem');
    window.localStorage.setItem('marketItem', JSON.stringify(item));
    cloneJob(item.id, item.jobConfig);
  });

  const cloneJob = (id, jobConfig) => {
    jobConfig = yaml.safeLoad(jobConfig);
    if (isJobV2(jobConfig)) {
      window.location.href = `/submit.html?op=marketplace_submit&itemId=${id}#/general`;
    } else {
      window.location.href = `/submit_v1.html`;
    }
  };

  const isJobV2 = jobConfig => {
    return (
      !isNil(jobConfig.protocol_version) || !isNil(jobConfig.protocolVersion)
    );
  };

  const populateUpdatedTime = () => {
    const uploadedTime = Math.floor(
      Math.abs(new Date() - new Date(item.updateDate)) / 1000 / 3600 / 24,
    );
    return uploadedTime === 0
      ? 'not long ago'
      : uploadedTime + (uploadedTime > 1 ? ' days ago' : ' day ago');
  };

  return (
    <Card key={item.Id}>
      <Stack>
        <Stack horizontal horizontalAlign='space-between' gap='l2'>
          <Stack gap='l1' styles={{ root: [{ width: '80%' }] }}>
            <Text
              styles={{
                root: {
                  fontSize: 16,
                  fontWeight: FontWeights.semibold,
                },
              }}
            >{item.name}</Text>
            <Text
              styles={{
                root: {
                  fontSize: 14,
                  fontWeight: FontWeights.regular,
                },
              }}
            >Author: {item.author}</Text>
            <Text
              nowrap
              styles={{
                root: {
                  fontSize: 14,
                  fontWeight: FontWeights.regular,
                },
              }}
            >{item.introduction}</Text>
            <TagBar tags={item.tags} />
            <Stack
              styles={{
                root: {
                  fontSize: 12,
                  fontWeight: FontWeights.regular,
                },
              }}
            >
              {item.author} updated {populateUpdatedTime()}
            </Stack>
          </Stack>
          <Stack gap='l2'>
            <Stack horizontal gap='l2'>
              <TooltipHost content='submits'>
                <Stack horizontal gap='s1'>
                  <Icon iconName='Copy' />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: FontWeights.regular,
                    }}
                  >
                    {item.submits}
                  </div>
                </Stack>
              </TooltipHost>
              <TooltipHost content='stars'>
                <Stack horizontal gap='s1'>
                  <Icon iconName='Like' />
                  <div
                    style={{
                      fontSize: 12,
                      FontWeights: FontWeights.regular,
                    }}
                  >
                    {item.stars}
                  </div>
                </Stack>
              </TooltipHost>
            </Stack>

            <Stack gap='m' styles={{ root: [{ paddingRight: spacing.l2 }] }}>
              <PrimaryButton
                styles={{
                  root: {
                    fontSize: 14,
                    fontWeight: FontWeights.regular,
                  },
                }}
                onClick={clickSubmit}
              >
                Submit
              </PrimaryButton>
              <DefaultButton
                styles={{
                  root: {
                    fontSize: 14,
                    fontWeight: FontWeights.regular,
                  },
                }}
                onClick={() => {
                  window.localStorage.removeItem('itemId');
                  window.localStorage.setItem('itemId', item.id);
                  history.push(`/market-detail?itemId=${item.id}`);
                }}
              >
                View
              </DefaultButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

ItemCard.propTypes = {
  item: PropTypes.object.isRequired,
};

export default ItemCard;
