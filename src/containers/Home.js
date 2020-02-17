import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import "./Home.css";
import ItemsList from "../components/ItemsList";
import Login from "./Login";

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
          photo: category.categoryPhoto,
          url: `/categories/${category.categoryId}`,
        }))}
        newItemUrl="/categories/new"
        size="large"
        alignment="center"
      />
    );
  }

  function renderLander() {
    return <Login isAuthenticated={props.isAuthenticated} userHasAuthenticated={props.userHasAuthenticated} />;
  }

  function renderCategories() {
    return (
      <div className="categories">
        <h1 className="page-header">Product Categories</h1>
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
