import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewProduct.css";
import PhotoViewer from '../components/PhotoViewer';

export default function NewProduct(props) {
  const [categoryId, setCategoryId] = useState(props.match.params.id);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [productsInCategory, setProductsInCategory] = useState([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productSalePrice, setProductSalePrice] = useState("");
  const [productOnSale, setProductOnSale] = useState(false);
  const [productSizes, setProductSizes] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [productPhotos, setProductPhotos] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function loadCategories() {
      return API.get("gbk-api", "/categories");
    }

    function loadProducts() {
      return API.get("gbk-api", `/products/${props.match.params.id}`);
    }

    function loadTags() {
      return API.get("gbk-api", "/tags");
    }

    function loadColors() {
      return API.get("gbk-api", "/colors");
    }

    function loadSizes() {
      return API.get("gbk-api", "/sizes");
    }

    async function onLoad() {
      try {
        const [categories, productsInCategory, tags, colors, sizes] = await Promise.all([
          loadCategories(), loadProducts(), loadTags(), loadColors(), loadSizes(),
        ]);

        setCategoryOptions(categories);

        setProductsInCategory(productsInCategory);

        const tagOptions = tags.map(tag => ({
          value: tag.tagId,
          label: tag.tagName,
        }));
        setTagOptions(tagOptions);

        const colorOptions = colors.map(color => ({
          value: color.colorId,
          label: color.colorName,
        }));
        setColorOptions(colorOptions);

        const sizeOptions = sizes.map(size => ({
          value: size.sizeId,
          label: size.sizeName,
        }));
        setSizeOptions(sizeOptions);
      } catch (e) {
        alert(e);
      }
    }

    onLoad();
  }, [props.match.params.id]);

  function validateDraftForm() {
    return productName.length > 0;
  }

  function validatePublishForm() {
    return (
      productName.length > 0
      && productDescription.length > 0
      && productPrice > 0
      && (!productOnSale || productSalePrice > 0)
      && (productSizes && productSizes.length > 0)
      && (productColors && productColors.length > 0)
      && (productPhotos && productPhotos.length > 0)
    );
  }

  function handleFileChange(event) {
    let i = 0;
    let nonImageFound = false;
    const files = Array.from(event.target.files);
    while (i < files.length && !nonImageFound) {
      const file = files[i];
      const splitFileName = file.name.toLowerCase().split('.');
      const fileExtension = splitFileName[splitFileName.length - 1];
      if (!["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
        nonImageFound = true;
      }
      i++;
    }
    if (nonImageFound) {
      alert(`Please upload image files only.`);
    } else {
      setProductPhotos(productPhotos.concat(Array.from(event.target.files)));
    }
  }

  function productNameExists() {
    const lowercaseName = productName.toLowerCase();
    const lowercaseNames = productsInCategory.map((productInCategory) => productInCategory.productName.toLowerCase());
    return lowercaseNames.includes(lowercaseName);
  }

  async function handleSubmit(productPublished) {
    if (productNameExists()) {
      window.alert('A product by this name already exists in this category.');
      return;
    }
    let updatedProductPhotos = productPhotos.map(productPhoto => ({
      name: productPhoto.name, url: productPhoto.url,
    }));
    if (productPhotos.length > 0) {
      const photoUploadPromises = [];
      productPhotos.forEach((productPhoto) => {
        photoUploadPromises.push(s3Upload(productPhoto));
      });
      if (productPublished) {
        setIsSaving(true);
      } else {
        setIsSavingDraft(true);
      }
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      productPhotos.forEach((productPhoto, index) => {
        updatedProductPhotos[index].name = photoURLs[photoURLsIndex];
        photoURLsIndex++;
      });
    }

    if (productPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const newProduct = await createProduct({
        productName,
        productDescription: productDescription !== "" ? productDescription : undefined,
        productPrice: productPrice !== "" ? productPrice : undefined,
        productSalePrice: productSalePrice !== "" ? productSalePrice : undefined,
        productOnSale,
        productPublished,
        categoryId,
      });
      await Promise.all([
        saveTags(newProduct.productId),
        saveColors(newProduct.productId),
        saveSizes(newProduct.productId),
        savePhotos(newProduct.productId, updatedProductPhotos),
      ]);
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  }

  function createProduct(product) {
    return API.post("gbk-api", "/products", {
      body: product
    });
  }

  async function saveTags(productId) {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productTags ? productTags.map(tag => tag.value) : [],
        productId,
        itemType: 'tag',
      }
    });
  }

  async function saveColors(productId) {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productColors ? productColors.map(color => color.value) : [],
        productId,
        itemType: 'color',
      }
    });
  }

  async function saveSizes(productId) {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productSizes ? productSizes.map(size => size.value) : [],
        productId,
        itemType: 'size',
      }
    });
  }

  async function savePhotos(productId, newProductPhotos) {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: newProductPhotos.map(photo => photo.name),
        productId,
        itemType: 'photo',
      }
    });
  }

  return (
    <div className="NewProduct">
      <div className="page-header">
        <h1>Create Product</h1>
        <div className="form-buttons">
          <LoaderButton
            onClick={() => handleSubmit(false)}
            size="lg"
            variant="outline-secondary"
            isLoading={isSavingDraft}
            disabled={!validateDraftForm()}
          >
            Save Draft
          </LoaderButton>
          <LoaderButton
            onClick={() => handleSubmit(true)}
            size="lg"
            variant="outline-primary"
            isLoading={isSaving}
            disabled={!validatePublishForm()}
          >
            Publish
          </LoaderButton>
        </div>
      </div>
      <Form>
        <div className="form-fields">
          <div className="left-half">
            <Form.Group controlId="categoryId">
              <Form.Label>Category</Form.Label>
              <Form.Control
                value={categoryId}
                as="select"
                onChange={e => setCategoryId(e.target.value)}
              >
                {categoryOptions.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="productName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={productName}
                type="text"
                onChange={e => !e.target.value.includes('_') && setProductName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="productDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                value={productDescription}
                as="textarea"
                onChange={e => setProductDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="productPrice">
              <Form.Label>Price</Form.Label>
              <Form.Control
                value={productPrice}
                type="number"
                onChange={e => setProductPrice(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="productSalePrice">
              <Form.Label>Sale Price</Form.Label>
              <Form.Control
                value={productSalePrice}
                type="number"
                onChange={e => setProductSalePrice(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="productOnSale">
              <Form.Check
                type="checkbox"
                checked={productOnSale}
                onChange={e => setProductOnSale(e.target.checked)}
                label="On Sale"
              />
            </Form.Group>
          </div>
          <div className="right-half">
            <Form.Group controlId="file">
              <Form.Label>Images</Form.Label>
              <Form.Control onChange={handleFileChange} type="file" multiple />
            </Form.Group>
            {productPhotos && productPhotos.length > 0 && (
              <PhotoViewer updateItems={setProductPhotos} list={productPhotos} />
            )}
            <Form.Group controlId="productSizes">
              <Form.Label>Sizes</Form.Label>
              <CreatableSelect
                isMulti
                onChange={setProductSizes}
                options={sizeOptions}
                placeholder=""
                value={productSizes}
              />
            </Form.Group>
            <Form.Group controlId="productColors">
              <Form.Label>Colors</Form.Label>
              <CreatableSelect
                isMulti
                onChange={setProductColors}
                options={colorOptions}
                placeholder=""
                value={productColors}
              />
            </Form.Group>
            <Form.Group controlId="productTags">
              <Form.Label>Tags</Form.Label>
              <CreatableSelect
                isMulti
                onChange={setProductTags}
                options={tagOptions}
                placeholder=""
                value={productTags}
              />
            </Form.Group>
          </div>
        </div>
      </Form>
    </div>
  );
}
