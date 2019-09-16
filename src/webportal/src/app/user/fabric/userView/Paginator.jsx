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

import React, { useContext } from 'react';

import { CommandBar } from 'office-ui-fabric-react';

import Context from './Context';
import Pagination from './Pagination';

export default function Paginator() {
  const { filteredUsers, pagination, setPagination } = useContext(Context);
  const { itemsPerPage, pageIndex } = pagination;
  const length = filteredUsers !== null ? filteredUsers.length : 0;
  const maxPageIndex = Math.floor(length / itemsPerPage);
  const start = itemsPerPage * pageIndex + 1;
  const end = Math.min(itemsPerPage * (pageIndex + 1), length);

  /** @type {import('office-ui-fabric-react').ICommandBarItemProps[]} */
  const farItems = [];

  /** @type {import('office-ui-fabric-react').IButtonStyles} */
  const buttonStyles = {
    root: { backgroundColor: 'white' },
    rootDisabled: { backgroundColor: 'white' },
  };

  function onClickItemsPerPage(event, { key }) {
    setPagination(new Pagination(key));
  }

  farItems.push({
    key: 'itemsPerPage',
    text: `${itemsPerPage} items per page`,
    buttonStyles,
    menuIconProps: { iconName: 'ChevronUp' },
    subMenuProps: {
      items: [20, 50, 100].map(number => ({
        key: String(number),
        text: String(number),
        onClick: onClickItemsPerPage,
      })),
    },
  });

  farItems.push({
    key: 'range',
    text: `${start}-${end} of ${length}`,
    buttonStyles,
    checked: true,
    disabled: true,
  });

  /**
   * @param {number} pageIndex
   */
  function setPage(pageIndex) {
    /**
     * @param {React.MouseEvent<Button>} event
     */
    return function onClick(event) {
      setPagination(new Pagination(pagination.itemsPerPage, pageIndex));
    };
  }

  /**
   * @param {number} page
   * @returns {import('office-ui-fabric-react').ICommandBarItemProps}
   */
  function getPageButton(page) {
    return {
      key: `page-${page}`,
      text: String(page + 1),
      buttonStyles,
      onClick: setPage(page),
    };
  }

  if (pageIndex !== 0) {
    farItems.push({
      key: 'page-previous',
      buttonStyles,
      iconProps: { iconName: 'ChevronLeft' },
      iconOnly: true,
      onClick: setPage(pageIndex - 1),
    });
  }

  if (pageIndex > 3) {
    farItems.push(
      getPageButton(0),
      getPageButton(1),
      { key: 'page-ellipsis-left', disabled: true, text: '...', buttonStyles },
      getPageButton(pageIndex - 1),
    );
  } else {
    for (let i = 0; i < pageIndex; i += 1) {
      farItems.push(getPageButton(i));
    }
  }

  farItems.push({
    key: `page-${pageIndex}`,
    checked: true,
    text: String(pageIndex + 1),
  });

  if (maxPageIndex - pageIndex > 3) {
    farItems.push(
      getPageButton(pageIndex + 1),
      { key: 'page-ellipsis-right', disabled: true, text: '...', buttonStyles },
      getPageButton(maxPageIndex - 1),
      getPageButton(maxPageIndex),
    );
  } else {
    for (let i = pageIndex + 1; i <= maxPageIndex; i += 1) {
      farItems.push(getPageButton(i));
    }
  }

  if (pageIndex !== maxPageIndex) {
    farItems.push({
      key: 'page-next',
      buttonStyles,
      iconProps: { iconName: 'ChevronRight' },
      iconOnly: true,
      onClick: setPage(pageIndex + 1),
    });
  }

  return (
    <CommandBar
      farItems={farItems}
      styles={{ root: { backgroundColor: 'white' } }}
    />
  );
}
