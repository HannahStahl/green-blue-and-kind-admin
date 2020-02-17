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
      <Form onSubmit={handleSubmit}>
        <h1 className="page-header">New Category</h1>
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
        <LoaderButton
          block
          type="submit"
          size="lg"
          variant="outline-primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
        <p className="note">Note: This category will not show up on your site yet.</p>
      </Form>
    </div>
  );
}
