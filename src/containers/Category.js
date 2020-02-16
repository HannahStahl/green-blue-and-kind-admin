import React, { useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import {
  ListGroup, FormGroup, FormControl, ControlLabel, PageHeader,
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./Category.css";
import ItemsList from "../components/ItemsList";

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
          category.categoryPhotoURL = await Storage.vault.get(categoryPhoto);
        }
        const promises = [];
        products.forEach((product) => {
          const photoIds = photosForProducts
            .filter(photoToProduct => photoToProduct.productId === product.productId)
            .map(photoToProduct => photoToProduct.photoId);
          const firstPhotoId = photoIds[0];
          const firstPhoto = firstPhotoId && photos.find(photo => photo.photoId === firstPhotoId);
          promises.push(firstPhoto && Storage.vault.get(firstPhoto.photoName));
        });
        const results = await Promise.all(promises);
        for (let i = 0; i < products.length; i++) {
          products[i].productPhoto = results[i];
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
        <PageHeader>Products</PageHeader>
        <ListGroup>
          {renderProductsList(products)}
        </ListGroup>
      </div>
    );
  }

  function renderCategoryDetails() {
    return (
      <form>
        <PageHeader>Category Details</PageHeader>
        <FormGroup controlId="categoryName">
          <ControlLabel>Name</ControlLabel>
          <FormControl
            value={categoryName}
            type="text"
            onChange={e => setCategoryName(e.target.value)}
          />
        </FormGroup>
        <FormGroup controlId="file">
          <ControlLabel>Image</ControlLabel>
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
        {products.length === 0 && (
          <p>Note: Category will remain in Draft state until it has at least one product.</p>
        )}
        <LoaderButton
          block
          onClick={() => handleSubmit(false)}
          bsSize="large"
          bsStyle="warning"
          isLoading={isSavingDraft}
          disabled={!validateForm()}
        >
          {category.categoryPublished ? 'Save & Unpublish' : 'Save Draft'}
        </LoaderButton>
        {products.length > 0 && (
            <LoaderButton
            block
            onClick={() => handleSubmit(true)}
            bsSize="large"
            bsStyle="primary"
            isLoading={isSaving}
            disabled={!validateForm()}
          >
            {category.categoryPublished ? 'Save' : 'Save & Publish'}
          </LoaderButton>
        )}
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
