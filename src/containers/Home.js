import React, { useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { PageHeader } from "react-bootstrap";
import "./Home.css";
import ItemsList from "../components/ItemsList";

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
    return (
      <ItemsList
        items={categories.map(category => ({
          id: category.categoryId,
          name: category.categoryName,
          photo: category.categoryPhotoObject,
          url: `/categories/${category.categoryId}`,
        }))}
        newItemUrl="/categories/new"
        size="large"
        alignment="center"
      />
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
        {!isLoading && renderCategoriesList(categories)}
      </div>
    );
  }

  return (
    <div className="Home">
      {props.isAuthenticated ? renderCategories() : renderLander()}
    </div>
  );
}
