import React, { useRef, useState, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { FormGroup, FormControl, ControlLabel } from "react-bootstrap";
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
  const [productSizes, setProductSizes] = useState("");
  const [productColors, setProductColors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadProduct() {
      return API.get("products", `/products/${props.match.params.id}`);
    }

    async function onLoad() {
      try {
        const product = await loadProduct();
        const {
          productName,
          productDescription,
          productPrice,
          productSalePrice,
          productSizes,
          productColors,
          productPhoto,
        } = product;

        if (productPhoto) {
          product.productPhotoURL = await Storage.vault.get(productPhoto);
        }

        setProductName(productName || "");
        setProductDescription(productDescription || "");
        setProductPrice(productPrice || "");
        setProductSalePrice(productSalePrice || "");
        setProductSizes(productSizes || "");
        setProductColors(productColors || "");
        setProduct(product);
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
      && productPrice.length > 0
      && productSizes.length > 0
      && productColors.length > 0
    );
  }

  function formatFilename(str) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  function saveProduct(product) {
    return API.put("products", `/products/${props.match.params.id}`, {
      body: product
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

      await saveProduct({
        productName,
        productDescription,
        productPrice,
        productSalePrice,
        productSizes,
        productColors,
        productPhoto: productPhoto || product.productPhoto
      });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsLoading(false);
    }
  }

  function deleteProduct() {
    return API.del("products", `/products/${props.match.params.id}`);
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
          <FormGroup controlId="productSizes">
            <ControlLabel>Sizes</ControlLabel>
            <FormControl
              value={productSizes}
              type="text"
              onChange={e => setProductSizes(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="productColors">
            <ControlLabel>Colors</ControlLabel>
            <FormControl
              value={productColors}
              type="text"
              onChange={e => setProductColors(e.target.value)}
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
