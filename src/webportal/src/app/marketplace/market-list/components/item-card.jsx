import propTypes from 'prop-types';
import React, { useCallback } from 'react';
import {
  Text,
  Stack,
  DefaultButton,
  PrimaryButton,
  TooltipHost,
} from 'office-ui-fabric-react';
import { getTheme, FontClassNames } from '@uifabric/styling';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { isNil } from 'lodash';
import yaml from 'js-yaml';

import { TagBar } from '../../components/tag-bar';
import Card from './card';

const { spacing } = getTheme();

const ItemCard = props => {
  const { item } = props;

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
            <TooltipHost content='marketItem'>
              <div className={FontClassNames.xLarge}>{item.name}</div>
            </TooltipHost>
            <div>Author: {item.author}</div>
            <Text nowrap>{item.introduction}</Text>
            <TagBar tags={item.tags} />
            <Stack>
              {item.author} updated {populateUpdatedTime()}
            </Stack>
          </Stack>

          <Stack gap='l1'>
            <Stack horizontal gap='l2'>
              <TooltipHost content='submits'>
                <Stack horizontal gap='s1'>
                  <Icon iconName='Copy' />
                  <div>{item.submits}</div>
                </Stack>
              </TooltipHost>
              <TooltipHost content='stars'>
                <Stack horizontal gap='s1'>
                  <Icon iconName='Like' />
                  <div>{item.stars}</div>
                </Stack>
              </TooltipHost>
            </Stack>

            <Stack gap='m' styles={{ root: [{ paddingRight: spacing.l2 }] }}>
              <PrimaryButton onClick={clickSubmit}>Submit</PrimaryButton>
              <DefaultButton href={`market-detail.html?itemId=${item.id}`}>
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
  item: propTypes.object.isRequired,
};

export default ItemCard;
