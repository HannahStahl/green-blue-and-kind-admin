import React, { useState } from "react";
import { API } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, PageHeader,
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewCategory.css";

export default function NewCategory(props) {
  const [file, setFile] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return categoryName.length > 0 && file;
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    const fileExtension = file.name.toLowerCase().split('.')[1];
    if (!["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
      alert(`Please upload an image file.`);
      return;
    }
    setFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const categoryPhoto = file ? await s3Upload(file) : null;
      await createCategory({ categoryName, categoryPhoto });
      props.history.push("/");
    } catch (e) {
      alert(e);
      setIsLoading(false);
    }
  }

  function createCategory(category) {
    return API.post("gbk-api", "/categories", {
      body: category
    });
  }

  return (
    <div className="NewCategory">
      <form onSubmit={handleSubmit}>
        <PageHeader>New Category</PageHeader>
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
          {file && (
            <FormControl.Static>
              <img
                src={URL.createObjectURL(file)}
                alt="Category Img"
                height={150}
              />
            </FormControl.Static>
          )}
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
