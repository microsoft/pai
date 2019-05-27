import { mergeStyleSets  } from '@uifabric/merge-styles'
import { FontSizes, IconFontSizes, FontWeights } from 'office-ui-fabric-react/lib/Styling';

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
        fontSize: FontSizes.icon
      },
      root: {
        background: 'white'
      }
    },
    tabIconStyle: {
      root: {
        fontSize: IconFontSizes.medium,
        margin: `0, ${marginSize.s1}`
      }
    }
  });
}

export const getFromTextFieldStyle = () => {
  return ({
    root: {
      marginLeft: marginSize.s1,
      marginTop: marginSize.m
    },
    label: {
      root: {
        fontSize: FontSizes.icon,
        fontWeight: FontWeights.regular,
        width: '20%'
      }
    },
    textFiled: {
      root: {
        width: '60%'
      }
    }
  });
}