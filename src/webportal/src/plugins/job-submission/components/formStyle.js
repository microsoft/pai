/*!
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

import { mergeStyleSets  } from '@uifabric/merge-styles'
import { FontSizes, IconFontSizes, FontWeights } from 'office-ui-fabric-react/lib/Styling';

export const marginSize = {
  l1: '20px',
  l2: '32px',
  m: '16px',
  s1: '8px',
  s2: '4px',
};

export const getFormClassNames  = () => {
  return mergeStyleSets ({
    topForm: {
      marginLeft: marginSize.l1,
      marginTop: marginSize.l1,
      marginBotton: marginSize.l2,
      marginRight: marginSize.l1,
      border: marginSize.l1 + ' solid white',
      background: 'white'
    },
    formTabBar: {
      background: '#f8f8f8',
      display: 'flex',
      alignItems: 'center'
    }
  });
}

export const getTabFromStyle = () => {
  return ({
    tab: {
      text: {
        fontSize: FontSizes.icon
      },
      root: {
        background: 'white'
      }
    },
    tabIcon: {
      root: {
        fontSize: IconFontSizes.medium,
        margin: `0, ${marginSize.s1}`
      }
    }
  });
}

export const getFormPageSytle = () => {
  return ({
    formPage: {
      root: {
        marginLeft: marginSize.s1
      }
    },
    formFirstColumn: {
      root: {
        width: '20%'
      }
    },
    formSecondColunm: {
      root: {
        width: '80%'
      }
    }
  });
}

export const getFormBasicSectionStyle = () => {
  return ({
    icon: {
      root: {
        fontSize: '8px',
        display: 'flex',
        alignItems: 'center',
        color: '#666666',
        cursor: 'pointer',
        userSelect: 'none'
      }
    },
    optionalText: {
      root: {
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center'
      }
    }
  });
}

export const getFromComponentsStyle = () => {
  return ({
    label: {
      root: {
        fontSize: FontSizes.icon,
        fontWeight: FontWeights.semibold,
      }
    },
    textFiled: {
      root: {
        width: '85%'
      }
    },
    formCompeletion: {
      horizonStack: {
        root: {
          width: '85%'
        }
      },
      textFiled: {
        root: {
          width: '75%'
        }
      },
      label: {
        root: {
          width: '25%',
          fontSize: FontSizes.icon,
          fontWeight: FontWeights.regular,
        }
      },
    }
  });
}

export const getParameterStyle = () => {
  return ({
    flexContainer: {
      alignItems: 'end',
      height: 'auto'
    },
    root: {
      height: 'auto'
    }
  });
}