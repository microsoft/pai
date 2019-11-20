import React, { useContext, useCallback } from 'react';
import { CommandBar } from 'office-ui-fabric-react';
import { isNil } from 'lodash';

import Pagination from '../Pagination';
import Context from '../Context';

export default function Paginator() {
  const { filteredItems, pagination, setPagination } = useContext(Context);

  const { itemsPerPage, pageIndex } = pagination;

  const allItemsNum = isNil(filteredItems) ? 0 : filteredItems.length;
  const maxPageIndex =
    allItemsNum % itemsPerPage === 0
      ? allItemsNum / itemsPerPage - 1
      : Math.floor(allItemsNum / itemsPerPage);

  const start = itemsPerPage * pageIndex + 1;
  const end = Math.min(start + itemsPerPage - 1, allItemsNum);

  const farItems = [];

  const buttonStyles = {
    root: { backgroundColor: 'white' },
    rootDisabled: { backgroundColor: 'white' },
  };

  const setPage = useCallback(index => {
    setPagination(new Pagination(itemsPerPage, index));
  });

  const getPageButton = useCallback(index => {
    return {
      key: `page-${index}`,
      text: String(index + 1),
      buttonStyles,
      onClick: () => setPage(index),
    };
  });

  // menu: items per page
  farItems.push({
    key: 'itemsPerPage',
    text: `${itemsPerPage} items per page`,
    buttonStyles,
    menuIconProps: { iconName: 'ChevronUp' },
    subMenuProps: {
      items: [1, 2, 5, 10, 15].map(number => ({
        key: number,
        text: String(number),
        onClick: (event, { key }) => {
          setPagination(new Pagination(key, 0));
        },
      })),
    },
  });

  // page items range
  farItems.push({
    key: 'range',
    text: `${start}-${end} of ${allItemsNum}`,
    buttonStyles,
    disabled: true,
  });

  // ChevronLeft
  if (pageIndex !== 0) {
    farItems.push({
      key: 'page-previous',
      buttonStyles,
      iconProps: { iconName: 'ChevronLeft' },
      onClick: () => setPage(pageIndex - 1),
    });
  }
  // previous tabs
  if (pageIndex <= 3) {
    for (let i = 0; i < pageIndex; i++) {
      farItems.push(getPageButton(i));
    }
  } else {
    farItems.push(getPageButton(0));
    farItems.push(getPageButton(1));
    farItems.push({
      key: 'page-ellipsis-left',
      text: '...',
      buttonStyles,
      disabled: true,
    });
    farItems.push(getPageButton(pageIndex - 1));
  }

  // current page
  farItems.push({
    key: `page-${pageIndex}`,
    text: `${pageIndex + 1}`,
    buttonStyles,
    checked: true,
    onClick: () => () => setPage(pageIndex),
  });

  // after pageIndex
  if (maxPageIndex - pageIndex > 3) {
    farItems.push(getPageButton(pageIndex + 1));
    farItems.push({
      key: 'page-ellipsis-right',
      text: '...',
      buttonStyles,
      disabled: true,
    });
    farItems.push(getPageButton(maxPageIndex - 1));
    farItems.push(getPageButton(maxPageIndex));
  } else {
    for (let i = pageIndex + 1; i <= maxPageIndex; i++) {
      farItems.push(getPageButton(i));
    }
  }

  // ChevronRight
  if (pageIndex < maxPageIndex) {
    farItems.push({
      key: 'page-next',
      buttonStyles,
      iconProps: { iconName: 'ChevronRight' },
      onClick: () => setPage(pageIndex + 1),
    });
  }

  return (
    <CommandBar
      farItems={farItems}
      styles={{ root: { backgroundColor: 'white' } }}
    />
  );
}
