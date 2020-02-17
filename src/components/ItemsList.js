import React from "react";
import { LinkContainer } from "react-router-bootstrap";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import config from '../config';
import "./ItemsList.css";

export default function ItemsList({ items, newItemUrl, size, alignment }) {
  return (
    <div className="ItemsList">
      <ListGroup className={alignment}>
        {[{}].concat(items).map((item, i) =>
          i !== 0 ? (
            <LinkContainer key={item.id} to={item.url}>
              <ListGroupItem className={size}>
                {item.photo && <img src={`${config.cloudfrontURL}/${item.photo}`} alt={item.name} />}
                <div className="item-name">
                  <h4>{item.name.trim().split("\n")[0]}</h4>
                </div>
              </ListGroupItem>
            </LinkContainer>
          ) : (
            <LinkContainer key="new" to={newItemUrl}>
              <ListGroupItem className={size}>
                <h4 className="new-item">{"\uFF0B"}</h4>
              </ListGroupItem>
            </LinkContainer>
          )
        )}
      </ListGroup>
    </div>
  );
};
