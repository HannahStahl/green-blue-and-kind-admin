import React, { useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { LinkContainer } from "react-router-bootstrap";
import {
  ListGroup, ListGroupItem, FormGroup, FormControl, ControlLabel,
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./Category.css";

export default function Category(props) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadCategory() {
      return API.get("gbk-api", `/category/${props.match.params.id}`);
    }
    function loadProductsForCategory() {
      return API.get("gbk-api", `/products/${props.match.params.id}`);
    }
    async function onLoad() {
      try {
        const [category, products] = await Promise.all([loadCategory(), loadProductsForCategory()]);
        const { categoryName, categoryPhoto } = category;
        if (categoryPhoto) {
          category.categoryPhotoURL = await Storage.vault.get(categoryPhoto);
        }
        setCategoryName(categoryName);
        setCategory(category);
        setProducts(products);
      } catch (e) {
        alert(e);
      }
    }
    onLoad();
  }, [props.match.params.id]);

  function validateForm() {
    return categoryName.length > 0 && (category.categoryPhotoURL || file);
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    setFile(event.target.files[0]);
  }

  function saveCategory(category) {
    return API.put("gbk-api", `/categories/${props.match.params.id}`, {
      body: category
    });
  }

  async function handleSubmit(event) {
    let categoryPhoto;
    event.preventDefault();
    if (file && file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE /
          1000000} MB.`
      );
      return;
    }
    setIsLoading(true);
    try {
      if (file) {
        categoryPhoto = await s3Upload(file);
      }
      await saveCategory({
        categoryName,
        categoryPhoto: categoryPhoto || category.categoryPhoto
      });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsLoading(false);
    }
  }

  function deleteCategory() {
    return API.del("gbk-api", `/categories/${props.match.params.id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();
    const confirmed = window.confirm(
      "Are you sure you want to delete this category of products?"
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteCategory();
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsDeleting(false);
    }
  }

  function renderProductsList(products) {
    return [{}].concat(products).map((product, i) =>
      i !== 0 ? (
        <LinkContainer key={product.productId} to={`/products/${product.productId}`}>
          <ListGroupItem header={product.productName.trim().split("\n")[0]}>
            {"Created: " + new Date(product.createdAt).toLocaleString()}
          </ListGroupItem>
        </LinkContainer>
      ) : (
        <LinkContainer key="new" to="/products/new">
          <ListGroupItem>
            <h4>
              <b>{"\uFF0B"}</b> Create a new product
            </h4>
          </ListGroupItem>
        </LinkContainer>
      )
    );
  }

  function renderProducts() {
    return (
      <div className="products">
        <ListGroup>
          {!isLoading && renderProductsList(products)}
        </ListGroup>
      </div>
    );
  }

  return (
    <div className="Category">
      {category && (
        <form onSubmit={handleSubmit}>
          <FormGroup controlId="categoryName">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              value={categoryName}
              type="text"
              onChange={e => setCategoryName(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="file">
            <ControlLabel>Photo</ControlLabel>
            <FormControl onChange={handleFileChange} type="file" />
            {(category.categoryPhoto || file) && (
              <FormControl.Static>
                <img
                  src={file ? URL.createObjectURL(file) : category.categoryPhotoURL}
                  alt={formatFilename(category.categoryPhoto)}
                  height={150}
                />
              </FormControl.Static>
            )}
          </FormGroup>
          <LoaderButton
            block
            type="submit"
            bsSize="large"
            bsStyle="primary"
            isLoading={isLoading}
            disabled={!validateForm()}
          >
            Save
          </LoaderButton>
          <LoaderButton
            block
            bsSize="large"
            bsStyle="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </LoaderButton>
        </form>
      )}
      {renderProducts()}
    </div>
  );
}
