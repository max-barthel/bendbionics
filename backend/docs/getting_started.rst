Getting Started
===============

This guide will help you get up and running with the Soft Robot API quickly.

Installation
------------

Prerequisites
~~~~~~~~~~~~~

* Python 3.11 or higher
* pip (Python package manager)
* Git

Install the API
~~~~~~~~~~~~~~~

1. **Clone the Repository**:
   .. code-block:: bash

      git clone <repository-url>
      cd soft-robot-app/backend

2. **Create Virtual Environment**:
   .. code-block:: bash

      python -m venv .venv
      source .venv/bin/activate  # On Windows: .venv\Scripts\activate

3. **Install Dependencies**:
   .. code-block:: bash

      pip install -r requirements.txt

4. **Initialize Database**:
   .. code-block:: bash

      python migrations.py

Running the Server
------------------

Development Mode
~~~~~~~~~~~~~~~~

Start the development server with auto-reload:

.. code-block:: bash

   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Production Mode
~~~~~~~~~~~~~~~

For production deployment:

.. code-block:: bash

   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

Configuration
-------------

Environment Variables
~~~~~~~~~~~~~~~~~~~~~

Create a `.env` file in the backend directory:

.. code-block:: env

   # Database
   DATABASE_URL=sqlite:///./soft_robot.db

   # Security
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # API Settings
   API_V1_STR=/api/v1
   PROJECT_NAME=Soft Robot API

   # CORS
   BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]

Database Configuration
~~~~~~~~~~~~~~~~~~~~~~

The API supports multiple database backends:

* **SQLite** (default): For development and testing
* **PostgreSQL**: For production deployments
* **MySQL**: Alternative production option

Example PostgreSQL configuration:

.. code-block:: env

   DATABASE_URL=postgresql://user:password@localhost/soft_robot_db

First API Call
--------------

Test the API with a simple health check:

.. code-block:: bash

   curl http://localhost:8000/health

Expected response:

.. code-block:: json

   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00Z",
     "version": "1.0.0"
   }

Authentication Setup
--------------------

1. **Register a User**:
   .. code-block:: bash

      curl -X POST "http://localhost:8000/auth/register" \
           -H "Content-Type: application/json" \
           -d '{
             "email": "user@example.com",
             "password": "securepassword",
             "full_name": "John Doe"
           }'

2. **Login**:
   .. code-block:: bash

      curl -X POST "http://localhost:8000/auth/login" \
           -H "Content-Type: application/json" \
           -d '{
             "username": "user@example.com",
             "password": "securepassword"
           }'

3. **Use the Token**:
   Include the returned access token in subsequent requests:

   .. code-block:: bash

      curl -X GET "http://localhost:8000/api/v1/robots" \
           -H "Authorization: Bearer <your-access-token>"

Interactive Documentation
-------------------------

The API provides interactive documentation at:

* **Swagger UI**: `http://localhost:8000/docs`
* **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to:

* Explore all available endpoints
* Test API calls directly from the browser
* View request/response schemas
* Download OpenAPI specification

Example Usage
-------------

Basic Robot Operations
~~~~~~~~~~~~~~~~~~~~~~

1. **Create a Robot**:
   .. code-block:: python

      import requests

      response = requests.post(
          "http://localhost:8000/api/v1/robots",
          headers={"Authorization": f"Bearer {token}"},
          json={
              "name": "My Robot",
              "description": "A test robot",
              "config": {
                  "segments": 5,
                  "tendons": 8
              }
          }
      )

      robot = response.json()

2. **Get Robot Status**:
   .. code-block:: python

      response = requests.get(
          f"http://localhost:8000/api/v1/robots/{robot['id']}",
          headers={"Authorization": f"Bearer {token}"}
      )

      status = response.json()

3. **Control Tendons**:
   .. code-block:: python

      response = requests.post(
          f"http://localhost:8000/api/v1/robots/{robot['id']}/tendons",
          headers={"Authorization": f"Bearer {token}"},
          json={
              "tendon_lengths": [10.0, 12.0, 8.0, 15.0, 9.0, 11.0, 13.0, 7.0]
          }
      )

      result = response.json()

Troubleshooting
---------------

Common Issues
~~~~~~~~~~~~~

**Port Already in Use**:
   .. code-block:: bash

      # Find process using port 8000
      lsof -i :8000

      # Kill the process
      kill -9 <PID>

**Database Connection Error**:
   - Check database URL in `.env` file
   - Ensure database server is running
   - Verify user permissions

**Import Errors**:
   - Activate virtual environment
   - Reinstall dependencies: `pip install -r requirements.txt`

**Authentication Issues**:
   - Check SECRET_KEY in `.env` file
   - Verify token expiration time
   - Ensure proper Authorization header format

Logs and Debugging
~~~~~~~~~~~~~~~~~~

Enable debug logging:

.. code-block:: env

   LOG_LEVEL=DEBUG

View logs:

.. code-block:: bash

   tail -f logs/app.log

Next Steps
----------

* Read the :doc:`api_reference` for detailed endpoint documentation
* Check out :doc:`examples` for more usage examples
* Learn about :doc:`authentication` for security best practices
* Review :doc:`deployment` for production setup
