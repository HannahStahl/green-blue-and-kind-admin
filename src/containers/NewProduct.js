import React, { useRef, useState } from "react";
import { API } from "aws-amplify";
import { FormGroup, FormControl, ControlLabel } from "react-bootstrap";
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
  const [productSizes, setProductSizes] = useState("");
  const [productColors, setProductColors] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return (
      productName.length > 0
      && productDescription.length > 0
      && productPrice.length > 0
      && productSizes.length > 0
      && productColors.length > 0
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

      await createProduct({
        productName,
        productDescription,
        productPrice,
        productSalePrice,
        productSizes,
        productColors,
        productPhoto,
      });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsLoading(false);
    }
  }

  function createProduct(product) {
    return API.post("products", "/products", {
      body: product
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
