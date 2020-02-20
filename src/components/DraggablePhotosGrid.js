import React from 'react';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import './DraggablePhotosGrid.css';

const SortableItem = sortableElement(({ item, removeItem }) => (
  <div className="photo-container">
    <p className="remove-photo" onClick={removeItem}>x</p>
    <img
      key={item.name}
      src={item.url || URL.createObjectURL(item)}
      alt={item.name}
      className="product-img"
    />
  </div>
));

const SortableContainer = sortableContainer(({ children }) => {
  return <div className="photos-container">{children}</div>;
});

const DraggablePhotosGrid = ({ items, updateItems }) => {
  const onSortEnd = ({ oldIndex, newIndex }) => {
    updateItems(arrayMove(items, oldIndex, newIndex));
  };

  const removeItem = (index) => {
    items.splice(index, 1);
    updateItems([...items]);
  }

  return (
    <SortableContainer onSortEnd={onSortEnd} axis="xy" pressDelay={100}>
      {items.map((item, index) => (
        <SortableItem key={item.name} item={item} index={index} removeItem={() => removeItem(index)} />
      ))}
    </SortableContainer>
  );
}

export default DraggablePhotosGrid;
