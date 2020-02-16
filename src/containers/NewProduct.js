import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, Checkbox, PageHeader,
} from "react-bootstrap";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewProduct.css";
import PhotoViewer from '../components/PhotoViewer';

export default function NewProduct(props) {
  const [categoryId, setCategoryId] = useState(props.match.params.id);
  const [categoryOptions, setCategoryOptions] = useState([]);
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function loadCategories() {
      return API.get("gbk-api", "/categories");
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
        const [categories, tags, colors, sizes] = await Promise.all([
          loadCategories(), loadTags(), loadColors(), loadSizes(),
        ]);

        setCategoryOptions(categories);

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
  }, []);

  function validateForm() {
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

  async function handleSubmit(event) {
    event.preventDefault();

    let updatedProductPhotos = productPhotos.map(productPhoto => ({
      name: productPhoto.name, url: productPhoto.url,
    }));
    if (productPhotos.length > 0) {
      const photoUploadPromises = [];
      productPhotos.forEach((productPhoto) => {
        photoUploadPromises.push(s3Upload(productPhoto));
      });
      setIsLoading(true);
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      productPhotos.forEach((productPhoto, index) => {
        updatedProductPhotos[index].name = photoURLs[photoURLsIndex];
        photoURLsIndex++;
      });
    }

    setIsLoading(true);

    try {
      const newProduct = await createProduct({
        productName,
        productDescription: productDescription !== "" ? productDescription : undefined,
        productPrice: productPrice !== "" ? productPrice : undefined,
        productSalePrice: productSalePrice !== "" ? productSalePrice : undefined,
        productOnSale,
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
      setIsLoading(false);
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
      <PageHeader>Create Product</PageHeader>
      <form onSubmit={handleSubmit}>
        <div className="form-fields">
          <div className="left-half">
            <FormGroup controlId="categoryId">
              <ControlLabel>Category</ControlLabel>
              <FormControl
                value={categoryId}
                componentClass="select"
                onChange={e => setCategoryId(e.target.value)}
              >
                {categoryOptions.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </FormControl>
            </FormGroup>
            <FormGroup controlId="productName">
              <ControlLabel>Name</ControlLabel>
              <FormControl
                value={productName}
                type="text"
                onChange={e => setProductName(e.target.value)}
              />
            </FormGroup>
            <FormGroup controlId="productDescription">
              <ControlLabel>Description</ControlLabel>
              <FormControl
                value={productDescription}
                componentClass="textarea"
                onChange={e => setProductDescription(e.target.value)}
              />
            </FormGroup>
            <FormGroup controlId="productPrice">
              <ControlLabel>Price</ControlLabel>
              <FormControl
                value={productPrice}
                type="number"
                onChange={e => setProductPrice(e.target.value)}
              />
            </FormGroup>
            <FormGroup controlId="productSalePrice">
              <ControlLabel>Sale Price</ControlLabel>
              <FormControl
                value={productSalePrice}
                type="number"
                onChange={e => setProductSalePrice(e.target.value)}
              />
            </FormGroup>
            <FormGroup controlId="productOnSale">
              <Checkbox
                checked={productOnSale}
                onChange={e => setProductOnSale(e.target.checked)}
              >
                On Sale
              </Checkbox>
            </FormGroup>
          </div>
          <div className="right-half">
            <FormGroup controlId="file">
              <ControlLabel>Images</ControlLabel>
              <FormControl onChange={handleFileChange} type="file" multiple />
            </FormGroup>
            {productPhotos && productPhotos.length > 0 && (
              <PhotoViewer updateItems={setProductPhotos} list={productPhotos} />
            )}
            <FormGroup controlId="productSizes">
              <ControlLabel>Sizes</ControlLabel>
              <CreatableSelect
                isMulti
                onChange={setProductSizes}
                options={sizeOptions}
                placeholder=""
                value={productSizes}
              />
            </FormGroup>
            <FormGroup controlId="productColors">
              <ControlLabel>Colors</ControlLabel>
              <CreatableSelect
                isMulti
                onChange={setProductColors}
                options={colorOptions}
                placeholder=""
                value={productColors}
              />
            </FormGroup>
            <FormGroup controlId="productTags">
              <ControlLabel>Tags</ControlLabel>
              <CreatableSelect
                isMulti
                onChange={setProductTags}
                options={tagOptions}
                placeholder=""
                value={productTags}
              />
            </FormGroup>
          </div>
        </div>
        <LoaderButton
          block
          type="submit"
          bsSize="large"
          bsStyle="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
      </form>
    </div>
  );
}
