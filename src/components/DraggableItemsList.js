import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { API } from "aws-amplify";
import config from '../config';
import "./DraggableItemsList.css";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  background: isDragging ? "#eee" : "white", ...draggableStyle
});

export default function DraggableItemsList({ originalItems, itemType, itemTypePlural, newItemURL }) {
  const [items, setItems] = useState(originalItems);
  useEffect(() => { setItems(originalItems); }, [originalItems])

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updatedItems = reorder(items, result.source.index, result.destination.index);
    const promises = [];
    updatedItems.forEach((item, index) => {
      promises.push(API.put("gbk-api", `/${itemTypePlural}/${item[`${itemType}Id`]}`, {
        body: { ...item, [`${itemType}Rank`]: index }
      }));
    });
    Promise.all(promises).then((results) => {
      const successfulResults = results.filter(result => result.status === true);
      if (successfulResults.length < results.length) {
        console.log('Error saving new order');
      } else {
        console.log(`Order of ${itemTypePlural} saved!`);
      }
    });
    setItems(updatedItems);
  }

  return (
    <div className="DraggableItemsList">
      <div className="item">
        <a className="item-name new-item" href={newItemURL}>
          <h4>{`+ Create new ${itemType}`}</h4>
        </a>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item[`${itemType}Id`]} draggableId={item[`${itemType}Id`]} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                      className="item"
                    >
                      <a href={`/${itemTypePlural}/${item[`${itemType}Id`]}`}>
                        <img
                          className="item-photo"
                          alt={item[`${itemType}Name`]}
                          src={item[`${itemType}Photo`] ? `${config.cloudfrontURL}/${item[`${itemType}Photo`]}` : `${process.env.PUBLIC_URL}/placeholder.jpg`}
                        />
                      </a>
                      <a className="item-name" href={`/${itemTypePlural}/${item[`${itemType}Id`]}`}>
                        <h4>{item[`${itemType}Name`]}</h4>
                      </a>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
