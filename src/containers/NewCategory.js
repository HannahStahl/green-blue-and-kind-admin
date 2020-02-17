import React, { useState } from "react";
import { API } from "aws-amplify";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import "./NewCategory.css";

export default function NewCategory(props) {
  const [file, setFile] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return categoryName.length > 0;
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
      <div className="page-header">
        <h1>Create Category</h1>
        <div className="form-buttons">
          <LoaderButton
            type="submit"
            size="lg"
            variant="outline-secondary"
            isLoading={isLoading}
            disabled={!validateForm()}
          >
            Save Draft
          </LoaderButton>
        </div>
      </div>
      <p className="note">Categories can be moved out of Draft state once they have at least one published product.</p>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="categoryName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={categoryName}
            type="text"
            onChange={e => setCategoryName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="file">
          <Form.Label>Image</Form.Label>
          <Form.Control onChange={handleFileChange} type="file" />
          {file && (
            <Form.Text>
              <img
                src={URL.createObjectURL(file)}
                alt="Category Img"
                height={150}
              />
            </Form.Text>
          )}
        </Form.Group>
      </Form>
    </div>
  );
}
