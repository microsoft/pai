// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Text,
  Label,
  Fabric,
  Stack,
  ColorClassNames,
  FontWeights,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  StackItem,
} from 'office-ui-fabric-react';
import { isNil, isEmpty, get } from 'lodash';
import PropTypes from 'prop-types';

import t from '../components/tachyons.scss';
import MonacoEditor from '../components/monaco-editor';

import Context from './components/context';

import { SpinnerLoading } from '../components/loading';

export const YamlEditPage = ({ isSingle, history, yamlText, setYamlText }) => {
  const [loading, setLoading] = useState(false);
  if (loading) {
    return <SpinnerLoading />;
  }
  return (
    <Fabric style={{ height: '100%', overflowX: 'auto' }}>
      <Stack
        style={{ root: { height: '100%', minWidth: 1000, minHeight: 720 } }}
        verticalAlign='space-between'
        gap='l1'
        padding='l1'
      >
        <Stack horizontal horizontalAlign='space-between' padding='0 m'>
          <Stack horizontal gap='m' verticalAlign='baseline'>
            <StackItem>
              <Text
                variant='xLarge'
                styles={{ root: { fontWeight: 'semibold' } }}
              >
                Protocol Yaml Edit Page
              </Text>
            </StackItem>
          </Stack>
          <Stack horizontal gap='s1'>
            <StackItem>
              <DefaultButton
                styles={{
                  root: [ColorClassNames.neutralTertiaryAltBackground],
                  rootHovered: [ColorClassNames.neutralTertiaryBackground],
                }}
              >
                Export
              </DefaultButton>
            </StackItem>
            <StackItem>
              <DefaultButton>
                <Label
                  styles={{
                    root: [
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        cursor: 'pointer',
                        fontWeight: FontWeights.semibold,
                      },
                      ColorClassNames.neutralTertiaryAltBackground,
                      ColorClassNames.neutralTertiaryBackgroundHover,
                    ],
                  }}
                >
                  {'Import'}
                  <input
                    type='file'
                    style={{
                      width: '1px',
                      height: '1px',
                      opacity: '.0001',
                    }}
                    accept='.yml,.yaml'
                  />
                </Label>
              </DefaultButton>
            </StackItem>
          </Stack>
        </Stack>
        <StackItem>
          <MessageBar messageBarType={MessageBarType.success}>
            Success MessageBar
          </MessageBar>
        </StackItem>
        <StackItem>
          <MonacoEditor
            className={t.overflowHidden}
            monacoProps={{
              width: 1000,
              height: 720,
              theme: 'vs',
              options: {
                wordWrap: 'on',
              },
            }}
          />
        </StackItem>
        <Stack
          horizontal
          gap='m'
          verticalAlign='baseline'
          horizontalAlign='space-between'
        >
          <StackItem>
            <DefaultButton
              text='Back'
              styles={{
                root: [ColorClassNames.neutralTertiaryAltBackground],
                rootHovered: [ColorClassNames.neutralTertiaryBackground],
              }}
            />
          </StackItem>
          <StackItem>
            <PrimaryButton text='Submit' />
          </StackItem>
        </Stack>
      </Stack>
    </Fabric>
  );
};

YamlEditPage.propTypes = {
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  yamlText: PropTypes.string,
  setYamlText: PropTypes.func,
};
