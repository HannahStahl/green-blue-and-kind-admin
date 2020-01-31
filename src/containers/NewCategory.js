import React, { useState } from "react";
import { API } from "aws-amplify";
import { FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import "./NewCategory.css";

export default function NewCategory(props) {
  const [file, setFile] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
    return categoryName.length > 0 && file;
  }

  function handleFileChange(event) {
    setFile(event.target.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (file && file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE /
          1000000} MB.`
      );
      return;
    }
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
        <FormGroup controlId="categoryName">
          <ControlLabel>Name</ControlLabel>
          <FormControl
            value={categoryName}
            type="text"
            onChange={e => setCategoryName(e.target.value)}
          />
        </FormGroup>
        <FormGroup controlId="file">
          <ControlLabel>Photo</ControlLabel>
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
