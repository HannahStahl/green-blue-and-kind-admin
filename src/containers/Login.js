import React, { useState } from "react";
import { Auth } from "aws-amplify";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../libs/hooksLib";
import "./Login.css";

export default function Login(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [fields, handleFieldChange] = useFormFields({ email: "", password: "" });

  function validateForm() {
    return fields.email.length > 0 && fields.password.length > 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      await Auth.signIn(fields.email, fields.password);
      props.userHasAuthenticated(true);
    } catch (e) {
      alert(e.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="Login">
      <div className="lander">
        <img
          alt="Green, Blue + Kind"
          src={`${process.env.PUBLIC_URL}/logo.png`}
          height="100"
        />
        <h1>Admin Console</h1>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="email" size="large">
          <Form.Label>Email</Form.Label>
          <Form.Control
            autoFocus
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group controlId="password" size="large">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={fields.password}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <LoaderButton
          block
          type="submit"
          size="lg"
          variant="outline-primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Log in
        </LoaderButton>
      </Form>
    </div>
  );
}
