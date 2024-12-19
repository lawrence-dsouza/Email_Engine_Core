# Email Engine Core

Welcome to the **Email Engine Core** project!

**Note: This project synchronizes and monitors changes only in the emails from the INBOX folder.**
## Prerequisites

Before you begin, make sure you have the following installed:

1. **Git** - To clone the repository.
   - [Download Git](https://git-scm.com/)
   
2. **Docker** - To run the project in containers.
   - [Download Docker](https://www.docker.com/products/docker-desktop)

3. **Docker Compose** (optional) - For easier management of multi-container applications.
   - [Install Docker Compose](https://docs.docker.com/compose/install/)

## Cloning the Repository

1. Open your terminal or command prompt.

2. Clone the repository using the command:

   ```bash
   git clone https://github.com/lawrence-dsouza/Email_Engine_Core.git
   ```
3. Change Directory:

    ```bash
    cd Email_Engine_Core
    ```
4. Copy the `.env` File
  
    Ensure that the `.env` file is placed at the root of the project.
5. Run the Project with Docker Compose

    a) Start Elasticsearch
      
      Open a terminal in this directory and run the following command to start Elasticsearch:
        
      ```bash
      docker compose up elasticsearch -d
      ```
    b) Set Up Elasticsearch Credentials
      
      Set up the Elasticsearch credentials by running:

      ```bash
      docker exec -it elasticsearch /bin/bash
      bin/elasticsearch-setup-passwords interactive
      ```
      
      When prompted, set the password to `password`.

      After setting the password, restart Elasticsearch:

      ```bash
      docker compose restart elasticsearch
      ```

    c) Start MongoDB
      
      Run the following command to start MongoDB:

      ```bash
      docker compose up mongo -d
      ```
    d) Start the Application

      Finally, run the application:
      
      ```bash
      docker compose up app
      ```

6. Verify the Setup
  
    You should see the following output:
    ```bash
    Connected to MongoDB!
    Connected to Elasticsearch
    Server running on http://localhost:3000/
    ```

7. Stop All Running Containers

    To stop all running containers, use the following command:
    ```bash
    docker compose down
    ```
