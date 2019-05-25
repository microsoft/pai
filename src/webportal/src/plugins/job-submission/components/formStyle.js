import { mergeStyleSets  } from '@uifabric/merge-styles'

const marginSize = {
  l1: '20px',
  l2: '32px',
  m: '16px',
  s1: '8px'
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

export const getFromStyle = () => {
  return ({
    tabStyle: {
      text: {
        fontSize: '16px'
      },
      root: {
        background: 'white'
      }
    },
    tabIconStyle: {
      root: {
        fontSize: '16px',
        margin: `0, ${marginSize.s1}`
      }
    }
  });
}