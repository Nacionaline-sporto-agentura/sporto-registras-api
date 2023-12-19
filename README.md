# Sporto Registras API

[![License](https://img.shields.io/github/license/Nacionaline-sporto-agentura/sporto-registras-api)](https://github.com/Nacionaline-sporto-agentura/sporto-registras-api/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/Nacionaline-sporto-agentura/sporto-registras-api)](https://github.com/Nacionaline-sporto-agentura/sporto-registras-api/issues)
[![GitHub stars](https://img.shields.io/github/stars/Nacionaline-sporto-agentura/sporto-registras-api)](https://github.com/Nacionaline-sporto-agentura/sporto-registras-api/stargazers)

This repository contains the source code and documentation for the Sporto Registras API, developed by the Nacionalinė sporto agentūra.

## Table of Contents

- [About the Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## About the Project

The Sporto Registras API is designed to provide information and functionalities related to management of athletes, sports bases & sports organizations.

## Getting Started

To get started with the Sporto Registras API, follow the instructions below.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Nacionaline-sporto-agentura/sporto-registras-api.git
   ```

2. Install the required dependencies:

   ```bash
   cd sporto-registras-api
   yarn install
   ```

### Usage

1. Set up the required environment variables. Copy the `.env.example` file to `.env` and provide the necessary values for the variables.

2. Start the API server:

   ```bash
   yarn dc:up
   yarn dev
   ```

The API will be available at `http://localhost:3000`.

## Deployment

### Production

To deploy the application to the production environment, create a new GitHub release:

1. Go to the repository's main page on GitHub.
2. Click on the "Releases" tab.
3. Click on the "Create a new release" button.
4. Provide a version number, such as `1.2.3`, and other relevant information.
5. Click on the "Publish release" button.

### Staging

The `main` branch of the repository is automatically deployed to the staging environment. Any changes pushed to the main
branch will trigger a new deployment.

### Development

To deploy any branch to the development environment use the `Deploy to Development` GitHub action.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a
pull request. For more information, see the [contribution guidelines](./CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](./LICENSE).
