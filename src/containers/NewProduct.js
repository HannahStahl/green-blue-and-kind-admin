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
  const [sizeOptions, setSizeOptions] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [productPhotos, setProductPhotos] = useState([]);
  const [photoURLs, setPhotoURLs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function loadTags() {
      return API.get("gbk-api", "/tags");
    }

    function loadColors() {
      return API.get("gbk-api", "/colors");
    }

    function loadSizes() {
      return API.get("gbk-api", "/sizes");
    }

    function loadPhotos() {
      return API.get("gbk-api", "/photos");
    }

    async function onLoad() {
      try {
        const [tags, colors, sizes, photos] = await Promise.all([
          loadTags(), loadColors(), loadSizes(), loadPhotos(),
        ]);
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
    );
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    setProductPhotos(productPhotos.concat(Array.from(event.target.files)));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (productPhotos.length > 0) {
      const photoUploadPromises = [];
      productPhotos.forEach((productPhoto) => {
        if (productPhoto.size > config.MAX_ATTACHMENT_SIZE) {
          alert(
            `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE /
              1000000} MB.`
          );
          return;
        } else {
          photoUploadPromises.push(s3Upload(productPhoto));
        }
      });
      setIsLoading(true);
      const photoURLs = await Promise.all(photoUploadPromises);
      let photoURLsIndex = 0;
      productPhotos.forEach((productPhoto, index) => {
        productPhotos[index] = photoURLs[photoURLsIndex];
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
      });
      await Promise.all([
        saveTags(newProduct.productId),
        saveColors(newProduct.productId),
        saveSizes(newProduct.productId),
        savePhotos(newProduct.productId),
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

  async function saveSizes(productId) {
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productSizes ? productSizes.map(size => size.value) : [],
        productId,
        itemType: 'size',
      }
    });
  }

  async function savePhotos(productId) {
    return API.post("gbk-api", "/values", {
      body: {
        selectedIds: productPhotos,
        productId,
        itemType: 'photo',
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
        {productPhotos && productPhotos.length > 0 && (
          <FormGroup>
            <ControlLabel>Photos</ControlLabel>
            <FormControl.Static>
              {productPhotos.map((productPhoto, index) => {
                const fileName = formatFilename(typeof productPhoto === 'string' ? productPhoto : productPhoto.name);
                return (
                  <a
                    key={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={photoURLs[index]}
                    style={{ display: 'block' }}
                  >
                    {fileName}
                  </a>
                );
              })}
            </FormControl.Static>
          </FormGroup>
        )}
        <FormGroup controlId="file">
          {(!productPhotos || productPhotos.length === 0) && <ControlLabel>Photos</ControlLabel>}
          <FormControl onChange={handleFileChange} type="file" multiple />
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
