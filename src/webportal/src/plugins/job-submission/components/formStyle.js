/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {FontSizes, FontWeights, getTheme, IconFontSizes,
        mergeStyleSets} from 'office-ui-fabric-react';

const {spacing, palette} = getTheme();

export const getFormClassNames = () => {
  return mergeStyleSets({
    formLayout: {
      margin: spacing.l1,
    },
    topForm: {
      border: spacing.l1 + ' solid white',
      background: palette.white,
    },
    formTabBar: {
      background: palette.neutralLighterAlt,
      alignItems: 'start',
    },
  });
};

export const getTabFromStyle = () => {
  return ({
    tabWapper: {
      root: {
        overflow: 'auto',
      },
    },
    tab: {
      text: {
        fontSize: FontSizes.icon,
      },
      root: {
        background: palette.white,
        overflowY: 'hidden',
      },
    },
    tabIcon: {
      root: {
        fontSize: IconFontSizes.medium,
        margin: `0, ${spacing.s1}`,
      },
    },
    tabContent: {
      root: {
        paddingTop: spacing.l2,
      },
    },
  });
};

export const getFormPageSytle = () => {
  return ({
    formPage: {
      root: {
        marginLeft: spacing.s1,
      },
    },
    formFirstColumn: {
      root: {
        width: '18%',
      },
    },
    formSecondColunm: {
      root: {
        width: '80%',
      },
    },
  });
};

export const getFormBasicSectionStyle = (optional) => {
  const visibility = !optional? 'hidden': 'visible';
  return ({
    icon: {
      root: {
        fontSize: FontSizes.mini,
        display: 'flex',
        alignItems: 'center',
        color: palette.neutralSecondary,
        cursor: 'pointer',
        userSelect: 'none',
        visibility: visibility,
      },
    },
    label: {
      root: {
        fontSize: FontSizes.icon,
        fontWeight: FontWeights.semibold,
        padding: '0px',
      },
    },
    optionalText: {
      root: {
        fontSize: FontSizes.mini,
        display: 'flex',
        alignItems: 'center',
      },
    },
  });
};

export const getParameterStyle = () => {
  return ({
    headerText: {
      root: {
        fontSize: FontSizes.large,
        fontWeight: FontWeights.semibold,
      },
    },
    actionButton: {
      flexContainer: {
        alignItems: 'end',
        height: 'auto',
      },
      root: {
        height: 'auto',
      },
    },
  });
};

const spinButtonStyle = {
  labelWrapper: {
    minWidth: '40%',
  },
};

export const getContainerSizeStyle = () => {
  return ({
    spinButton: spinButtonStyle,
  });
};

export const getCompletionSectionStyle = () => {
  return ({
    spinButton: spinButtonStyle,
  });
};

export const getFormShortSectionStyle = () => {
  return ({
    root: {
      width: '60%',
    },
  });
};
