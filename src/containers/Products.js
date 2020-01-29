import React, { useRef, useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, Checkbox,
} from "react-bootstrap";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./Products.css";

export default function Products(props) {
  const file = useRef(null);
  const [product, setProduct] = useState(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productSalePrice, setProductSalePrice] = useState("");
  const [productOnSale, setProductOnSale] = useState(false);
  const [productSizes, setProductSizes] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadProduct() {
      return API.get("gbk-api", `/products/${props.match.params.id}`);
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

    // TODO load sizes too

    async function onLoad() {
      try {
        const [
          product, tags, tagsForProduct, colors, colorsForProduct,
        ] = await Promise.all([
          loadProduct(), loadTags(), loadTagsForProduct(), loadColors(), loadColorsForProduct(),
        ]);
        const {
          productName,
          productDescription,
          productPrice,
          productSalePrice,
          productOnSale,
          productPhoto,
        } = product;

        if (productPhoto) {
          product.productPhotoURL = await Storage.vault.get(productPhoto);
        }

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
      } catch (e) {
        alert(e);
      }
    }

    onLoad();
  }, [props.match.params.id]);

  function validateForm() {
    return (
      productName.length > 0
      && productDescription.length > 0
      && productPrice > 0
      && (!productOnSale || productSalePrice > 0)
      // && productSizes && productSizes.length > 0 // TODO add this back in
      && productColors && productColors.length > 0
    );
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  function saveProduct(product) {
    return API.put("gbk-api", `/products/${props.match.params.id}`, {
      body: product
    });
  }

  async function saveTags() {
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productTags ? productTags.map(tag => tag.value) : [],
        productId: props.match.params.id,
        itemType: 'tag',
      }
    });
  }

  async function saveColors() {
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productColors ? productColors.map(color => color.value) : [],
        productId: props.match.params.id,
        itemType: 'color',
      }
    });
  }

  async function handleSubmit(event) {
    let productPhoto;

    event.preventDefault();

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE /
          1000000} MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      if (file.current) {
        productPhoto = await s3Upload(file.current);
      }

      await Promise.all([
        saveProduct({
          productName,
          productDescription: productDescription !== "" ? productDescription : undefined,
          productPrice: productPrice !== "" ? productPrice : undefined,
          productSalePrice: productSalePrice !== "" ? productSalePrice : undefined,
          productOnSale,
          productPhoto: productPhoto || product.productPhoto
        }),
        saveTags(),
        saveColors(),
      ]);
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsLoading(false);
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
    <div className="Products">
      {product && (
        <form onSubmit={handleSubmit}>
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
          <FormGroup controlId="productSizes">
            <ControlLabel>Sizes</ControlLabel>
            <CreatableSelect
              isMulti
              onChange={setProductSizes}
              options={[]} // TODO
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
          {product.productPhoto && (
            <FormGroup>
              <ControlLabel>Photo</ControlLabel>
              <FormControl.Static>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={product.productPhotoURL}
                >
                  {formatFilename(product.productPhoto)}
                </a>
              </FormControl.Static>
            </FormGroup>
          )}
          <FormGroup controlId="file">
            {!product.productPhoto && <ControlLabel>Photo</ControlLabel>}
            <FormControl onChange={handleFileChange} type="file" />
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
    </div>
  );
}
