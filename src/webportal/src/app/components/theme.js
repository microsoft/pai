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
import { loadTheme, FontWeights, getTheme } from '@uifabric/styling';
export function initTheme() {
  loadTheme({
    spacing: {
      s2: '4px',
      s1: '8px',
      m: '16px',
      l1: '20px',
      l2: '32px',
      l3: '64px',
    },
    fonts: {
      xLarge: {
        fontSize: 20,
        fontWeight: FontWeights.semibold,
      },
      large: {
        fontSize: 16,
        fontWeight: FontWeights.regular,
      },
    },
    palette: {
      themePrimary: '#0071bc',
      themeLighterAlt: '#f2f8fc',
      themeLighter: '#cde5f4',
      themeLight: '#a5cfeb',
      themeTertiary: '#56a4d7',
      themeSecondary: '#187fc5',
      themeDarkAlt: '#0066aa',
      themeDark: '#00568f',
      themeDarker: '#003f6a',
      neutralLighterAlt: '#f8f8f8',
      neutralLighter: '#f4f4f4',
      neutralLight: '#eaeaea',
      neutralQuaternaryAlt: '#dadada',
      neutralQuaternary: '#d0d0d0',
      neutralTertiaryAlt: '#c8c8c8',
      neutralTertiary: '#c2c2c2',
      neutralSecondary: '#858585',
      neutralPrimaryAlt: '#4b4b4b',
      neutralPrimary: '#333333',
      neutralDark: '#272727',
      black: '#1d1d1d',
      white: '#ffffff',
      red: '#eb1123',
      yellowLight: '#fcd116',
      blue: '#0071bc',
      greenLight: '#7fba00',
    },
  });
}

const { palette } = getTheme();

export const statusColor = {
  waiting: '#fcd116',
  failed: '#eb1123',
  running: '#0071bc',
  succeeded: '#7fba00',
  stopped: palette.neutralTertiaryAlt,
  unknown: palette.neutralTertiary,
};
