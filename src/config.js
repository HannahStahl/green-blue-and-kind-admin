const dev = {
  s3: {
    REGION: "us-east-1",
    BUCKET: "green-blue-and-kind-api-dev-attachmentsbucket-29s444udnid4"
  },
  apiGateway: {
    REGION: "us-east-1",
    URL: "https://qwppkge4a7.execute-api.us-east-1.amazonaws.com/dev"
  },
  cognito: {
    REGION: "us-east-1",
    USER_POOL_ID: "us-east-1_SEHnYlJPv",
    APP_CLIENT_ID: "3le7ad7p8t4d50hbsqjnajjsnj",
    IDENTITY_POOL_ID: "us-east-1:128f9f37-325c-4f00-9c74-f40b7e43b327"
  }
};

const prod = {
  s3: {
    REGION: "us-east-1",
    BUCKET: "green-blue-and-kind-api-prod-attachmentsbucket-e94p4wcvi3xw"
  },
  apiGateway: {
    REGION: "us-east-1",
    URL: "https://3jw0egh7y8.execute-api.us-east-1.amazonaws.com/prod"
  },
  cognito: {
    REGION: "us-east-1",
    USER_POOL_ID: "us-east-1_RuMYAj0Tt",
    APP_CLIENT_ID: "7bqsfcmeek0hghv6pl4g5j306s",
    IDENTITY_POOL_ID: "us-east-1:0c94fde4-d85b-4c11-8afb-f2612ea6cf77"
  }
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

export default {
  // Add common config values here
  ...config
};
