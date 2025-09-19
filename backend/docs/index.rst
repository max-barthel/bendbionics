Soft Robot API Documentation
============================

Welcome to the Soft Robot API documentation! This comprehensive guide provides everything you need to understand and integrate with our soft robot simulation API.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   getting_started
   api_reference
   authentication
   models
   examples
   deployment

Overview
--------

The Soft Robot API is a FastAPI-based backend service that provides:

* **Robot Simulation**: Advanced soft robot kinematics and dynamics
* **Tendon Control**: Precise tendon length and tension management
* **Preset Management**: Save and load robot configurations
* **User Authentication**: Secure user management and access control
* **Real-time Processing**: High-performance simulation engine

Key Features
------------

* **RESTful API**: Clean, intuitive REST endpoints
* **OpenAPI Documentation**: Interactive API documentation
* **Type Safety**: Full TypeScript/Python type definitions
* **Authentication**: JWT-based secure authentication
* **Validation**: Comprehensive input validation and error handling
* **Performance**: Optimized for real-time simulation

Quick Start
-----------

1. **Install Dependencies**:
   .. code-block:: bash

      pip install -r requirements.txt

2. **Start the Server**:
   .. code-block:: bash

      uvicorn app.main:app --reload

3. **Access Documentation**:
   Visit `http://localhost:8000/docs` for interactive API documentation.

API Endpoints
-------------

* **Authentication**: `/auth/*` - User login, registration, and management
* **Robots**: `/robots/*` - Robot configuration and control
* **Tendons**: `/tendons/*` - Tendon length and tension management
* **Presets**: `/presets/*` - Save and load robot presets
* **Health**: `/health` - API health and status

Authentication
--------------

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

.. code-block:: http

   Authorization: Bearer <your-jwt-token>

Rate Limiting
-------------

* **Standard Users**: 100 requests per minute
* **Premium Users**: 1000 requests per minute
* **Admin Users**: Unlimited requests

Error Handling
--------------

The API returns standard HTTP status codes and detailed error messages:

* **200**: Success
* **400**: Bad Request - Invalid input data
* **401**: Unauthorized - Invalid or missing authentication
* **403**: Forbidden - Insufficient permissions
* **404**: Not Found - Resource not found
* **422**: Validation Error - Input validation failed
* **500**: Internal Server Error - Server-side error

Support
-------

* **Documentation**: This comprehensive guide
* **API Reference**: Interactive documentation at `/docs`
* **GitHub Issues**: Report bugs and request features
* **Discord**: Community support and discussions

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
