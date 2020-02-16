import React, { useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, Checkbox, PageHeader,
} from "react-bootstrap";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./Product.css";
import PhotoViewer from '../components/PhotoViewer';

export default function Product(props) {
  const [product, setProduct] = useState(null);
  const [categoryId, setCategoryId] = useState("");
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
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadCategories() {
      return API.get("gbk-api", "/categories");
    }

    function loadProduct() {
      return API.get("gbk-api", `/product/${props.match.params.id}`);
    }

    function loadTags() {
      return API.get("gbk-api", "/tags");
    }

    function loadTagsForProduct() {
      return API.get("gbk-api", `/productsToTags/${props.match.params.id}`);
    }

    function loadColors() {
      return API.get("gbk-api", "/colors");
    }

    function loadColorsForProduct() {
      return API.get("gbk-api", `/productsToColors/${props.match.params.id}`);
    }

    function loadSizes() {
      return API.get("gbk-api", "/sizes");
    }

    function loadSizesForProduct() {
      return API.get("gbk-api", `/productsToSizes/${props.match.params.id}`);
    }

    function loadPhotos() {
      return API.get("gbk-api", "/photos");
    }

    function loadPhotosForProduct() {
      return API.get("gbk-api", `/productsToPhotos/${props.match.params.id}`);
    }

    async function onLoad() {
      try {
        const [
          categories,
          product,
          tags,
          tagsForProduct,
          colors,
          colorsForProduct,
          sizes,
          sizesForProduct,
          photos,
          photosForProduct,
        ] = await Promise.all([
          loadCategories(),
          loadProduct(),
          loadTags(),
          loadTagsForProduct(),
          loadColors(),
          loadColorsForProduct(),
          loadSizes(),
          loadSizesForProduct(),
          loadPhotos(),
          loadPhotosForProduct(),
        ]);
        const {
          categoryId,
          productName,
          productDescription,
          productPrice,
          productSalePrice,
          productOnSale,
        } = product;

        if (photosForProduct) {
          const productPhotos = [];
          const photoURLPromises = [];
          photosForProduct.forEach((photoForProduct) => {
            const fileName = photos.find(photo => photo.photoId === photoForProduct.photoId).photoName;
            productPhotos.push({ name: fileName });
            photoURLPromises.push(Storage.vault.get(fileName));
          });
          const photoURLs = await Promise.all(photoURLPromises);
          photosForProduct.forEach((photoForProduct, index) => {
            productPhotos[index].url = photoURLs[index];
          });
          setProductPhotos(productPhotos);
        }

        setCategoryOptions(categories);
        setCategoryId(categoryId);
        setProductName(productName || "");
        setProductDescription(productDescription || "");
        setProductPrice(productPrice || "");
        setProductSalePrice(productSalePrice || "");
        setProductOnSale(productOnSale || "");
        setProduct(product);

        const tagOptions = tags.map(tag => ({
          value: tag.tagId,
          label: tag.tagName,
        }));
        setTagOptions(tagOptions);
        const selectedTagOptions = tagsForProduct.map(tagForProduct => ({
          value: tagForProduct.tagId,
          label: tags.find(tag => tag.tagId === tagForProduct.tagId).tagName,
        }));
        setProductTags(selectedTagOptions);

        const colorOptions = colors.map(color => ({
          value: color.colorId,
          label: color.colorName,
        }));
        setColorOptions(colorOptions);
        const selectedColorOptions = colorsForProduct.map(colorForProduct => ({
          value: colorForProduct.colorId,
          label: colors.find(color => color.colorId === colorForProduct.colorId).colorName,
        }));
        setProductColors(selectedColorOptions);

        const sizeOptions = sizes.map(size => ({
          value: size.sizeId,
          label: size.sizeName,
        }));
        setSizeOptions(sizeOptions);
        const selectedSizeOptions = sizesForProduct.map(sizeForProduct => ({
          value: sizeForProduct.sizeId,
          label: sizes.find(size => size.sizeId === sizeForProduct.sizeId).sizeName,
        }));
        setProductSizes(selectedSizeOptions);
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

  function saveProduct(product) {
    return API.put("gbk-api", `/products/${props.match.params.id}`, {
      body: product
    });
  }

  async function saveTags() {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productTags ? productTags.map(tag => tag.value) : [],
        productId: props.match.params.id,
        itemType: 'tag',
      }
    });
  }

  async function saveColors() {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productColors ? productColors.map(color => color.value) : [],
        productId: props.match.params.id,
        itemType: 'color',
      }
    });
  }

  async function saveSizes() {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: productSizes ? productSizes.map(size => size.value) : [],
        productId: props.match.params.id,
        itemType: 'size',
      }
    });
  }

  async function savePhotos(newProductPhotos) {
    return API.post("gbk-api", "/items", {
      body: {
        selectedIds: newProductPhotos.map(photo => photo.name),
        productId: props.match.params.id,
        itemType: 'photo',
      }
    });
  }

  async function handleSubmit(productPublished) {
    let updatedProductPhotos = productPhotos.map(productPhoto => ({
      name: productPhoto.name, url: productPhoto.url,
    }));
    if (productPhotos.length > 0) {
      const photoUploadPromises = [];
      productPhotos.forEach((productPhoto) => {
        if (productPhoto.size) {
          photoUploadPromises.push(s3Upload(productPhoto));
        }
      });
      if (productPublished) {
        setIsSaving(true);
      } else {
        setIsSavingDraft(true);
      }
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      productPhotos.forEach((productPhoto, index) => {
        if (productPhoto.size) {
          updatedProductPhotos[index].name = photoURLs[photoURLsIndex];
          photoURLsIndex++;
        }
      });
    }

    if (productPublished) {
      setIsSaving(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      await Promise.all([
        saveProduct({
          productName,
          productDescription: productDescription !== "" ? productDescription : undefined,
          productPrice: productPrice !== "" ? productPrice : undefined,
          productSalePrice: productSalePrice !== "" ? productSalePrice : undefined,
          productOnSale,
          productPublished,
          categoryId,
        }),
        savePhotos(updatedProductPhotos),
        saveTags(),
        saveColors(),
        saveSizes(),
      ]);
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  }

  function deleteProduct() {
    return API.del("gbk-api", `/products/${props.match.params.id}`);
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteProduct();
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Product">
      <PageHeader>Edit Product</PageHeader>
      {product && (
        <form>
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
              onClick={() => handleSubmit(false)}
              bsSize="large"
              bsStyle="warning"
              isLoading={isSavingDraft}
              disabled={!validateDraftForm()}
            >
              {product.productPublished ? 'Save & Unpublish' : 'Save Draft'}
            </LoaderButton>
            <LoaderButton
              block
              onClick={() => handleSubmit(true)}
              bsSize="large"
              bsStyle="primary"
              isLoading={isSaving}
              disabled={!validatePublishForm()}
            >
              {product.productPublished ? 'Save' : 'Save & Publish'}
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
    </div>
  );
}
