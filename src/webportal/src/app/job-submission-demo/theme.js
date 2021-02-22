// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const theme = {
  breakpoints: ['40em', '52em', '64em'],

  space: [0, 4, 8, 16, 20, 32, 64, 128, 256, 512],

  fontSizes: [12, 14, 16, 20, 24, 36, 48, 80, 96, 128],

  fontWeights: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900],

  lineHeights: ['1.0', '1.25', '1.5'],

  //   sizes: [],

  borderWidths: [0, '1px', '2px', '4px', '8px', '16px', '32px'],

  //   borderStyles: [],

  radii: [0, '2px', '4px', '16px', '9999px', '100%'],

  //   shadows: [],

  //   zIndices: [],

  measures: ['20em', '30em', '34em'],

  // typefaces: {
  //   serif: 'athelas, georgia, times, serif',
  //   sansSerif:
  //     'system-ui, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
  //   mono: 'Consolas, monaco, monospace',
  // },

  colors: {
    'dark-red': '#e7040f',
    red: '#ff4136',
    'light-red': '#ff725c',
    'washed-red': '#ffdfdf',
    orange: '#ff6300',
    gold: '#ffb700',
    yellow: '#ffd700',
    'light-yellow': '#fbf1a9',
    'washed-yellow': '#fffceb',
    purple: '#5e2ca5',
    'light-purple': '#a463f2',
    'dark-pink': '#d5008f',
    'hot-pink': '#ff41b4',
    pink: '#ff80cc',
    'light-pink': '#ffa3d7',
    'dark-green': '#137752',
    green: '#19a974',
    'light-green': '#9eebcf',
    'washed-green': '#e8fdf5',
    navy: '#001b44',
    'dark-blue': '#00449e',
    blue: '#357edd',
    'light-blue': '#96ccff',
    'lightest-blue': '#cdecff',
    'washed-blue': '#f6fffe',
    black: '#000',
    'near-black': '#111',
    'dark-gray': '#333',
    'mid-gray': '#555',
    gray: '#777',
    silver: '#999',
    'light-silver': '#aaa',
    'moon-gray': '#ccc',
    'light-gray': '#eee',
    neutralTertiary: '#c2c2c2',
    'near-white': '#f8f8f8',
    white: '#fff',
    'black-90': 'rgba(0,0,0,.9)',
    'black-80': 'rgba(0,0,0,.8)',
    'black-70': 'rgba(0,0,0,.7)',
    'black-60': 'rgba(0,0,0,.6)',
    'black-50': 'rgba(0,0,0,.5)',
    'black-40': 'rgba(0,0,0,.4)',
    'black-30': 'rgba(0,0,0,.3)',
    'black-20': 'rgba(0,0,0,.2)',
    'black-10': 'rgba(0,0,0,.1)',
    'black-05': 'rgba(0,0,0,.05)',
    'black-025': 'rgba(0,0,0,.025)',
    'black-0125': 'rgba(0,0,0,.0125)',
    'white-90': 'rgba(255,255,255,.9)',
    'white-80': 'rgba(255,255,255,.8)',
    'white-70': 'rgba(255,255,255,.7)',
    'white-60': 'rgba(255,255,255,.6)',
    'white-50': 'rgba(255,255,255,.5)',
    'white-40': 'rgba(255,255,255,.4)',
    'white-30': 'rgba(255,255,255,.3)',
    'white-20': 'rgba(255,255,255,.2)',
    'white-10': 'rgba(255,255,255,.1)',
    'white-05': 'rgba(255,255,255,.05)',
    'white-025': 'rgba(255,255,255,.025)',
    'white-0125': 'rgba(255,255,255,.0125)',
    errorText: '#a80000',
  },
};

theme.breakpoints.sm = theme.breakpoints[0];
theme.breakpoints.md = theme.breakpoints[1];
theme.breakpoints.lg = theme.breakpoints[2];

theme.space.s2 = theme.space[1];
theme.space.s1 = theme.space[2];
theme.space.m = theme.space[3];
theme.space.l1 = theme.space[4];
theme.space.l2 = theme.space[5];
theme.space.l3 = theme.space[6];

theme.fontSizes.s3 = theme.fontSizes[0];
theme.fontSizes.s2 = theme.fontSizes[1];
theme.fontSizes.s1 = theme.fontSizes[2];
theme.fontSizes.m = theme.fontSizes[3];
theme.fontSizes.l1 = theme.fontSizes[4];
theme.fontSizes.l2 = theme.fontSizes[5];
theme.fontSizes.l3 = theme.fontSizes[6];

theme.fontWeights.lighter = theme.fontWeights[1];
theme.fontWeights.normal = theme.fontWeights[4];
theme.fontWeights.bold = theme.fontWeights[7];
theme.fontWeights.bolder = theme.fontWeights[9];

export default theme;
