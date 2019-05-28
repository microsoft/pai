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

export const getFromComponentsStyle = () => {
  return ({
    label: {
      root: {
        fontSize: FontSizes.icon,
        fontWeight: FontWeights.regular
      }
    },
    textFiled: {
      root: {
        width: '85%'
      }
    },
    suffixText: {
      root: {
        margin: 'auto',
      }
    }
  });
}