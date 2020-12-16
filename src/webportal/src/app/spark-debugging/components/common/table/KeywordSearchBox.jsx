import React, { useContext } from 'react'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';

import TableContext from './TableContext';
import Filter from './Filter';

function KeywordSearchBox() {
  const { filter, setFilter } = useContext(TableContext);

  function onKeywordChange(keyword) {
    setFilter(new Filter(keyword.trim(), filter.filterKey));
  }

  /** @type {import('office-ui-fabric-react').IStyle} */
  const rootStyles = { backgroundColor: 'transparent', alignSelf: 'center', width: 220 };

  return (
    <SearchBox
      underlined
      placeholder={`Search by ${filter.filterKey}`}
      styles={{ root: rootStyles }}
      value={filter.keyword}
      onChange={onKeywordChange}
    />
  );
}

export default KeywordSearchBox;
