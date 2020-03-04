import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

const LoadingSpinner = () => (
  <div>
    <Spinner variant="secondary" animation="border" role="status">
      <span className="sr-only">Loading...</span>
    </Spinner>
  </div>
);

export default LoadingSpinner;
