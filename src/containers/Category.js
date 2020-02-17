import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./Category.css";
import ItemsList from "../components/ItemsList";
import config from '../config';

export default function Category(props) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadCategory() {
      return API.get("gbk-api", `/category/${props.match.params.id}`);
    }
    function loadProductsForCategory() {
      return API.get("gbk-api", `/products/${props.match.params.id}`);
    }
    function loadPhotos() {
      return API.get("gbk-api", "/photos");
    }
    function loadProductsToPhotos() {
      return API.get("gbk-api", "/productsToPhotos");
    }
    async function onLoad() {
      try {
        const [category, products, photos, photosForProducts] = await Promise.all([
          loadCategory(), loadProductsForCategory(), loadPhotos(), loadProductsToPhotos(),
        ]);
        const { categoryName, categoryPhoto } = category;
        if (categoryPhoto) {
          category.categoryPhotoURL = `${config.cloudfrontURL}/${categoryPhoto}`;
        }
        products.forEach((product, i) => {
          const photoIds = photosForProducts
            .filter(photoToProduct => photoToProduct.productId === product.productId)
            .map(photoToProduct => photoToProduct.photoId);
          const firstPhotoId = photoIds[0];
          const firstPhoto = firstPhotoId && photos.find(photo => photo.photoId === firstPhotoId);
          products[i].productPhoto = firstPhoto && firstPhoto.photoName;
        });
        setCategoryName(categoryName);
        setCategory(category);
        setProducts(products);
      } catch (e) {
        alert(e);
      }
    }
    onLoad();
  }, [props.match.params.id]);

  function validateDraftForm() {
    return categoryName.length > 0;
  }

  function validatePublishForm() {
    return categoryName.length > 0 && (category.categoryPhotoURL || file);
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    const splitFileName = file.name.toLowerCase().split('.');
    const fileExtension = splitFileName[splitFileName.length - 1];
    if (!["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
      alert(`Please upload an image file.`);
      return;
    }
    setFile(file);
  }

  function saveCategory(category) {
    return API.put("gbk-api", `/categories/${props.match.params.id}`, {
      body: category
    });
  }

  async function handleSubmit(categoryPublished) {
    let categoryPhoto;
    if (categoryPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }
    try {
      if (file) {
        categoryPhoto = await s3Upload(file);
      }
      await saveCategory({
        categoryName,
        categoryPhoto: categoryPhoto || category.categoryPhoto,
        categoryPublished,
      });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
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
    return (
      <ItemsList
        items={products.map(product => ({
          id: product.productId,
          name: product.productName,
          photo: product.productPhoto,
          url: `/products/${product.productId}`,
        }))}
        newItemUrl={`/products/new/${category.categoryId}`}
        size="small"
        alignment="left"
      />
    );
  }

  function renderProducts() {
    return (
      <div className="products">
        <h1 className="page-header">Products</h1>
        <ListGroup>
          {renderProductsList(products)}
        </ListGroup>
      </div>
    );
  }

  function renderCategoryDetails() {
    return (
      <Form>
        <h1 className="page-header">Category Details</h1>
        <Form.Group controlId="categoryName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={categoryName}
            type="text"
            onChange={e => setCategoryName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="file">
          <Form.Label>Image</Form.Label>
          <Form.Control onChange={handleFileChange} type="file" />
          <img
            src={file ? URL.createObjectURL(file) : category.categoryPhotoURL}
            alt={categoryName}
            height={150}
          />
        </Form.Group>
        <div className="form-buttons">
          {products.filter((product) => product.productPublished).length === 0 && (
            <p>Note: Category will remain in Draft state until it has at least one published product.</p>
          )}
          <LoaderButton
            block
            onClick={() => handleSubmit(false)}
            size="lg"
            variant="outline-secondary"
            isLoading={isSavingDraft}
            disabled={!validateDraftForm()}
          >
            {category.categoryPublished ? 'Save & Unpublish' : 'Save Draft'}
          </LoaderButton>
          {products.filter((product) => product.productPublished).length > 0 && (
              <LoaderButton
              block
              onClick={() => handleSubmit(true)}
              size="lg"
              variant="outline-primary"
              isLoading={isSaving}
              disabled={!validatePublishForm()}
            >
              {category.categoryPublished ? 'Save' : 'Save & Publish'}
            </LoaderButton>
          )}
          <LoaderButton
            block
            size="lg"
            variant="outline-danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </LoaderButton>
        </div>
      </Form>
    );
  }

  return (
    <div className="Category">
      {category && (
        <>
          {renderCategoryDetails()}
          {<div className="divider" />}
          {renderProducts()}
        </>
      )}
    </div>
  );
}
