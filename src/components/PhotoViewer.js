import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./PhotoViewer.css";

function Item({ item, index }) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {item.content}
        </div>
      )}
    </Draggable>
  );
}

const ItemList = React.memo(function ItemList({ items }) {
  return (
    <div className="photos-container">
      {items.map((item, index) => <Item item={item} index={index} key={item.id} />)}
    </div>
  );
});

export default function PhotoViewer({ list, updateItems }) {
  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };
  function removeItem(list, index) {
    const result = Array.from(list);
    result.splice(index, 1);
    return result;
  }
  function onDragEnd(result) {
    if (!result.destination || (result.destination.index === result.source.index)) return;
    updateItems(reorder(list, result.source.index, result.destination.index));
  }
  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="list" direction="horizontal">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <ItemList items={list.map((productPhoto, i) => {
              const fileName = formatFilename(productPhoto.name);
              return {
                id: fileName,
                content: (
                  <div className="photo-container">
                    <p className="remove-photo" onClick={() => updateItems(removeItem(list, i))}>x</p>
                    <img
                      key={fileName}
                      src={productPhoto.url || URL.createObjectURL(productPhoto)}
                      alt={fileName}
                      height={150}
                    />
                  </div>
                )
              };
            })} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}