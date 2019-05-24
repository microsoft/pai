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
      background: '#eeeeee'
    }
  });
}