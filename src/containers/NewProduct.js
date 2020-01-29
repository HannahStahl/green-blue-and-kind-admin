import React, { useRef, useState, useEffect } from "react";
import { API } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, Checkbox,
} from "react-bootstrap";
import CreatableSelect from 'react-select/creatable';
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./NewProduct.css";

export default function NewProduct(props) {
  const file = useRef(null);
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

  useEffect(() => {
    function loadTags() {
      return API.get("gbk-api", "/tags");
    }

    function loadColors() {
      return API.get("gbk-api", "/colors");
    }

    // TODO load sizes too

    async function onLoad() {
      try {
        const [tags, colors] = await Promise.all([loadTags(), loadColors()]);
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
      } catch (e) {
        alert(e);
      }
    }

    onLoad();
  });

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

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  async function handleSubmit(event) {
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
      const productPhoto = file.current
        ? await s3Upload(file.current)
        : null;

      const newProduct = await createProduct({
        productName,
        productDescription: productDescription !== "" ? productDescription : undefined,
        productPrice: productPrice !== "" ? productPrice : undefined,
        productSalePrice: productSalePrice !== "" ? productSalePrice : undefined,
        productOnSale,
        productPhoto,
      });
      await Promise.all([saveTags(newProduct.productId), saveColors(newProduct.productId)]);
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
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productTags ? productTags.map(tag => tag.value) : [],
        productId,
        itemType: 'tag',
      }
    });
  }

  async function saveColors(productId) {
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productColors ? productColors.map(color => color.value) : [],
        productId,
        itemType: 'color',
      }
    });
  }

  return (
    <div className="NewProduct">
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
        <FormGroup controlId="file">
          <ControlLabel>Photo</ControlLabel>
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
          Create
        </LoaderButton>
      </form>
    </div>
  );
}
