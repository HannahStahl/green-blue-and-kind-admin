import React from "react";
import { Route, Switch } from "react-router-dom";
import AppliedRoute from "./components/AppliedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import Home from "./containers/Home";
import Login from "./containers/Login";
import Category from "./containers/Category";
import Product from "./containers/Product";
import Signup from "./containers/Signup";
import NewCategory from "./containers/NewCategory";
import NewProduct from "./containers/NewProduct";
import NotFound from "./containers/NotFound";

export default function Routes({ appProps }) {
  return (
    <Switch>
      <AppliedRoute path="/" exact component={Home} appProps={appProps} />
      <UnauthenticatedRoute path="/login" exact component={Login} appProps={appProps} />
      <UnauthenticatedRoute path="/signup" exact component={Signup} appProps={appProps} />
      <AuthenticatedRoute path="/categories/new" exact component={NewCategory} appProps={appProps} />
      <AuthenticatedRoute path="/categories/:id" exact component={Category} appProps={appProps} />
      <AuthenticatedRoute path="/products/new" exact component={NewProduct} appProps={appProps} />
      <AuthenticatedRoute path="/products/:id" exact component={Product} appProps={appProps} />
      {/* Finally, catch all unmatched routes */}
      <Route component={NotFound} />
    </Switch>
  );
}
