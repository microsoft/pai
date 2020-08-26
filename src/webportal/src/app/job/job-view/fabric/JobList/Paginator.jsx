import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { TextField, Stack, DefaultButton } from 'office-ui-fabric-react';

import Context from './Context';
import Pagination from './Pagination';

function GotoPage(props) {
  const [pageIndex, setPageIndex] = useState(props.pageIndex);

  return (
    <Stack
      horizontal
      verticalAlign='center'
      gap='5'
      horizontalAlign='space-between'
      styles={{ root: { padding: 10 } }}
    >
      <TextField
        value={pageIndex}
        styles={{ fieldGroup: { width: 80 } }}
        onChange={(_, newValue) => {
          try {
            const newPageIndex = Number.parseInt(newValue);
            setPageIndex(newPageIndex);
          } catch {}
        }}
        onKeyPress={event => {
          if (event.key === 'Enter') {
            props.setPage(pageIndex - 1);
          }
        }}
      />
      <DefaultButton
        styles={{ root: { minWidth: '40px' } }}
        text='GO'
        onClick={() => props.setPage(pageIndex - 1)}
      />
    </Stack>
  );
}

GotoPage.propTypes = {
  pageIndex: PropTypes.number,
  setPage: PropTypes.func,
  styles: PropTypes.object,
};

export default function Paginator() {
  const { filteredJobsInfo, pagination, setPagination } = useContext(Context);
  const { itemsPerPage, pageIndex } = pagination;

  const length = filteredJobsInfo ? filteredJobsInfo.totalCount : 0;
  const maxPageIndex = Math.floor(length / itemsPerPage);
  const start = itemsPerPage * pageIndex + 1;
  const end = Math.min(itemsPerPage * (pageIndex + 1), length);

  if (pageIndex > maxPageIndex) {
    const newPagination = new Pagination(pagination.itemsPerPage, 0);
    newPagination.save();
    setPagination(newPagination);
  }

  /** @type {import('office-ui-fabric-react').ICommandBarItemProps[]} */
  const farItems = [];

  /** @type {import('office-ui-fabric-react').IButtonStyles} */
  const buttonStyles = {
    root: { backgroundColor: 'white' },
    rootDisabled: { backgroundColor: 'white' },
  };

  function onClickItemsPerPage(_, { key }) {
    const pagination = new Pagination(key);
    pagination.save();
    setPagination(pagination);
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
    return function onClick(_) {
      const newPagenation = new Pagination(pagination.itemsPerPage, pageIndex);
      newPagenation.save();
      setPagination(newPagenation);
    };
  }

  function gotoPageIndex(pageIndex) {
    const newPagenation = new Pagination(pagination.itemsPerPage, pageIndex);
    newPagenation.save();
    setPagination(newPagenation);
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
    <Stack horizontal horizontalAlign='end' verticalAlign='center'>
      <CommandBar
        farItems={farItems}
        styles={{ root: { backgroundColor: 'white' } }}
      />
      <GotoPage pageIndex={pageIndex + 1} setPage={gotoPageIndex} />
    </Stack>
  );
}
