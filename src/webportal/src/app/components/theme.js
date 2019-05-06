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

import {loadTheme, FontWeights} from '@uifabric/styling';

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
        fontSize: 17,
        fontWeight: FontWeights.regular,
      },
    },
  });
}

export const color = {
  red: '#eb1123',
  yellow: '#fcd116',
  green: '#7fba00',
  blue: '#0071bc',
  gray: '#b1b5b8',
};

export const statusColorMapping = {
  waiting: color.yellow,
  failed: color.red,
  running: color.blue,
  succeeded: color.green,
  unknown: color.gray,
};
