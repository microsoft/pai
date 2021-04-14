// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { Text, FontWeights, Link } from 'office-ui-fabric-react';

import { ExportConfig } from './export-config';
import { ImportConfig } from './import-config';
import { Flex } from '../../elements';
import theme from '../../theme';

export const Topbar = () => {
  const generateOldVersionHref = url => {
    return url.replace(
      /(submit_demo.html)(\?[\s\S]+)?(#\/[\w]+)$/gm,
      'submit.html$2#/general',
    );
  };
  return (
    <Flex justifyContent='space-between'>
      <Flex alignItems='baseline'>
        <Text
          variant='xLarge'
          styles={{
            root: {
              marginRight: theme.space.m,
              fontWeight: FontWeights.semibold,
            },
          }}
        >
          Job submission
        </Text>
        <Link
          target='_blank'
          href='https://openpai.readthedocs.io/en/latest/manual/cluster-user/quick-start.html'
          style={{
            marginRight: theme.space.m,
            fontWeight: FontWeights.semibold,
            fontSize: 14,
          }}
        >
          {'Learn more >'}
        </Link>
        <Link
          target='_self'
          href={generateOldVersionHref(window.location.href)}
          style={{ fontWeight: FontWeights.semibold, fontSize: 14 }}
        >
          {'Switch to old version'}
        </Link>
      </Flex>
      <Flex>
        <ExportConfig />
        <ImportConfig />
      </Flex>
    </Flex>
  );
};
