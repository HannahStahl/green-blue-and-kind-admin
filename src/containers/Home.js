import React, { useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { LinkContainer } from "react-router-bootstrap";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import "./Home.css";

export default function Home(props) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!props.isAuthenticated) {
        return;
      }
      try {
        const categories = await loadCategories();
        const promises = [];
        categories.forEach((category) => {
          promises.push(Storage.vault.get(category.categoryPhoto));
        });
        const photos = await Promise.all(promises);
        categories.forEach((category, index) => {
          categories[index].categoryPhotoObject = photos[index];
        });
        setCategories(categories);
      } catch (e) {
        alert(e);
      }
      setIsLoading(false);
    }
    onLoad();
  }, [props.isAuthenticated]);

  function loadCategories() {
    return API.get("gbk-api", "/categories");
  }

  function renderCategoriesList(categories) {
    return [{}].concat(categories).map((category, i) =>
      i !== 0 ? (
        <LinkContainer key={category.categoryId} to={`/categories/${category.categoryId}`}>
          <ListGroupItem>
            <img src={category.categoryPhotoObject} alt={category.categoryName} />
            <div className="category-name">
              <h4>{category.categoryName.trim().split("\n")[0]}</h4>
            </div>
          </ListGroupItem>
        </LinkContainer>
      ) : (
        <LinkContainer key="new" to="/categories/new">
          <ListGroupItem>
            <h4><b>{"\uFF0B"}</b></h4>
          </ListGroupItem>
        </LinkContainer>
      )
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Product Management Console</h1>
      </div>
    );
  }

  function renderCategories() {
    return (
      <div className="categories">
        <PageHeader>Product Categories</PageHeader>
        <ListGroup>
          {!isLoading && renderCategoriesList(categories)}
        </ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {props.isAuthenticated ? renderCategories() : renderLander()}
    </div>
  );
}
