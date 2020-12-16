import React from 'react';

export default function FilterButton({defaultRender: Button, ...props}) {
    const {subMenuProps: {items}} = props;
    const checkedItems = items.filter((item) => item.checked).map((item) => item.text);
    const checkedText = checkedItems.length === 0 ? null
      : checkedItems.length === 1 ? <strong>{checkedItems[0]}</strong>
      : <strong>{checkedItems[0]}{` (+${checkedItems.length - 1})`}</strong>;
    return (
      <Button {...props}>
        {checkedText}
      </Button>);
  }