// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import c from 'classnames';
import {ColorClassNames, DefaultButton, Panel, PanelType, Stack, CommandBar, CommandBarButton, concatStyleSets, memoizeFunction} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, {useRef} from 'react';
import MonacoEditor from './monaco-editor';
import t from './tachyons.scss';

const MonacoPanel = ({isOpen, onDismiss, title, header, footer, monacoProps, completionItems, schemas, monacoRef}) => {
  const panelRef = useRef(null);
  function getHeaderTitle() {
		return {
			key: 'monacoPanel',
			name: 'monacoPanel',
			text: title,
			buttonStyles: {root: { height: '100%'}},
			iconProps: {
				iconName: 'FileCode',
			},
		};
	}

	function  getClose() {
		return {
			key: 'close',
			name: 'Close',
			buttonStyles: {root: { height: '100%', color: 'white'}},
			iconOnly: true,
			iconProps: {
				iconName: 'Cancel',
			},
			onClick() {
        panelRef.current && panelRef.current.dismiss();
			},
		};
	}

	const headerTitleItems = [getHeaderTitle()];
  const headerCloseFarItems = [getClose()];
  
  const CustomButton= props => {
    const itemStyles = {
      label: { fontSize: 18 },
      icon: { color: '#0071BC'},
      iconHovered: { color: '#003F6A' },
    };
    const getCommandBarButtonStyles = memoizeFunction(
      (originalStyles) => {
        if (!originalStyles) {
          return itemStyles;
        }
        return concatStyleSets(originalStyles, itemStyles);
      },
    );
    return <CommandBarButton {...props} styles={getCommandBarButtonStyles(props.styles)} />;
  };

  return (
    <div>
      <Panel
        componentRef={panelRef}
        onDismiss={onDismiss}
        isLightDismiss={true}
        hasCloseButton={false}
        isOpen={isOpen}
        type={PanelType.large}
        styles={{
          overlay: [ColorClassNames.blackTranslucent40Background],
          content: [t.flex, t.flexAuto, t.flexColumn, {padding: '0!important'}],
          scrollableContent: [t.flex, t.flexAuto, {overflowY: 'visible'}],
        }}
        >
        <Stack className={c(t.pb3)}>
          <CommandBar
            items={headerTitleItems}
            farItems={headerCloseFarItems}
            styles={{root: {padding: 0, width: '100%', height: 50}}}
            buttonAs={CustomButton}
          />
        </Stack>
        {header && <div className={c(t.mb4, t.flex)}>
          {header}
        </div>}
        <div className={c(t.flexAuto, t.flex, t.flexColumn)}>
          <MonacoEditor
            style={{flex: '1 1 100%', minHeight: 0}}
            monacoRef={monacoRef}
            monacoProps={{
              language: 'text',
              options: {
                wordWrap: 'on',
                readOnly: true,
              },
              ...monacoProps,
            }}
            completionItems={completionItems}
            schemas={schemas}
          />
          <div className={c(t.mt4, t.flex, t.justifyBetween)}>
            <div>
              {footer}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

MonacoPanel.propTypes = {
  // panel props
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  // monaco props
  monacoProps: PropTypes.object,
  schemas: PropTypes.array,
  completionItems: PropTypes.arrayOf(PropTypes.string),
  monacoRef: PropTypes.object,
};

export default MonacoPanel;
