import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import "./Home.css";
import DraggableItemsList from "../components/DraggableItemsList";
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
      <div>
        <DraggableItemsList
          itemType='category'
          itemTypePlural='categories'
          originalItems={categories}
          newItemURL='/categories/new'
        />
      </div>
    );
  }

  function renderLander() {
    return <Login isAuthenticated={props.isAuthenticated} userHasAuthenticated={props.userHasAuthenticated} />;
  }

  function renderCategories() {
    return (
      <div className="categories">
        <div className="page-header">
          <h1>Product Categories</h1>
        </div>
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
