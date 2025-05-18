Milk Management System BackendThis is the backend API for the Milk Management System, built using FastAPI. It handles user authentication, rate list management (including image upload and OCR processing), and other core functionalities.Table of ContentsPrerequisitesSetupCloning the RepositoryCreating and Activating a Virtual EnvironmentInstalling DependenciesConfigurationEnvironment VariablesDatabase SetupRunning the ApplicationDevelopment ModeProduction ModeProject StructureAPI DocumentationContributingLicensePrerequisitesBefore you begin, ensure you have the following installed:Python 3.7+: Download Pythonpip: Python's package installer (usually comes with Python)Virtual Environment Tool: venv (built-in with Python 3.3+) or condaMySQL Database: The application uses MySQL. Ensure you have a running MySQL server.SetupCloning the RepositoryFirst, clone the backend repository to your local machine:git clone <repository_url>
cd <repository_directory>
Creating and Activating a Virtual EnvironmentIt's highly recommended to use a virtual environment to isolate your project's dependencies.Using venv (recommended):python -m venv venv
Activate the virtual environment:On macOS and Linux:source venv/bin/activate
On Windows:.\venv\Scripts\activate
You should see (venv) or a similar indicator in your terminal prompt, signifying that the virtual environment is active.Installing DependenciesWith your virtual environment activated, install the required Python packages using pip:pip install -r requirements.txt
(Make sure you have a requirements.txt file listing all your project's dependencies, including fastapi, uvicorn, sqlalchemy, pymysql, python-dotenv, pytz, pandas, google-generativeai, python-multipart, jose, passlib, bcrypt, etc.)ConfigurationEnvironment VariablesThe application uses environment variables for configuration, loaded from .env files using python-dotenv. You can have different configuration files for different environments (e.g., development, production).Create Environment Files: In the root directory of the backend project, create the following files:.env.dev (for development settings).env.prod (for production settings).env (optional, for common settings or fallback)Define Variables: Add your configuration variables to the respective files..env.dev (Example):# .env.dev - Development Environment Configuration

# Application Environment

APP_ENV=dev

# Timezone

TZ=Asia/Kolkata

# JWT Security

SECRET_KEY=your_dev_secret_key_CHANGE_THIS # Use a different key than production!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60 # Longer expiration in dev for convenience

# Google Gemini API Key (if needed for development)

GEMINI_API_KEY=YOUR_GEMINI_API_KEY_DEV

# Database Configuration (for your local development database)

DB_USER=root
DB_PASSWORD=your_local_db_password
DB_HOST=localhost
DB_NAME=nits
DB_PORT=3306

# Other dev settings...

# LOG_LEVEL=DEBUG

.env.prod (Example):# .env.prod - Production Environment Configuration

# Application Environment

APP_ENV=prod

# Timezone

TZ=Asia/Kolkata # Or your production timezone

# JWT Security

SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY_CHANGE_THIS_SECURELY # !!! CRITICAL: Use a strong, unique key !!!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30 # Standard expiration

# Google Gemini API Key (for production)

GEMINI_API_KEY=YOUR_GEMINI_API_KEY_PROD

# Database Configuration (for your production database)

DB_USER=your_prod_db_user
DB_PASSWORD=your_prod_db_password
DB_HOST=your_prod_db_host
DB_NAME=your_prod_db_name
DB_PORT=your_prod_db_port

# Other prod settings...

# LOG_LEVEL=INFO

GitIgnore: Add .env, .env.dev, .env.prod (and any other .env.\* files) to your .gitignore file to prevent accidentally committing sensitive credentials.# .gitignore

# ... other ignored files ...

.env*
temp_uploads/ # Ignore temporary file upload directory
venv/ # Ignore virtual environment directory
**pycache**/
*.pyc
Database SetupThe application uses SQLAlchemy models defined in app/db/models.py. The database tables are created automatically on application startup if they don't exist (configured in app/main.py).Ensure your MySQL server is running and accessible with the credentials provided in your .env file.The database specified by DB_NAME should exist.Running the ApplicationYou will use Uvicorn to run the FastAPI application.Development ModeFor development, run the application with the --reload flag and set the APP_ENV environment variable to dev.Activate your virtual environment.Set the APP_ENV variable:On macOS and Linux:export APP_ENV=dev
On Windows:$env:APP_ENV="dev"

# Or using cmd: set APP_ENV=dev

Run the Uvicorn server:uvicorn app.main:app --reload
The API will be available at http://127.0.0.1:8000 (or the port specified by Uvicorn). The --reload flag will automatically restart the server when you make code changes.Production ModeFor production, run the application without the --reload flag and set the APP_ENV environment variable to prod. You should also consider using a production-ready server like Gunicorn with Uvicorn workers.Activate your virtual environment.Set the APP_ENV variable:On macOS and Linux:export APP_ENV=prod
On Windows:$env:APP_ENV="prod"

# Or using cmd: set APP_ENV=prod

Run the application (example with Uvicorn directly - not recommended for production):uvicorn app.main:app --host 0.0.0.0 --port 8000
(Use --host 0.0.0.0 to make the server accessible externally if needed).Recommended production setup with Gunicorn and Uvicorn workers:pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app -b 0.0.0.0:8000
(This runs 4 worker processes).Ensure your production environment has the correct .env.prod file in place and that it is not publicly accessible.Project Structure(You can include a brief overview or a tree structure of your project here, similar to what we discussed previously)your_fastapi_project/
├── app/
│ ├── api/
│ │ └── endpoints/
│ │ ├── auth.py
│ │ └── ratelist.py
│ ├── core/
│ │ ├── config.py
│ │ ├── security.py
│ │ └── logging_config.py
│ ├── db/
│ │ ├── models.py
│ │ └── session.py
│ ├── middleware/
│ │ └── jwt_middleware.py
│ ├── schemas/
│ │ ├── ratelist.py
│ │ └── user.py
│ ├── services/
│ │ └── ocr_parser.py
│ └── main.py
├── tests/
├── .env.dev
├── .env.prod
├── .gitignore
├── requirements.txt
└── README.md
API DocumentationOnce the server is running, you can access the automatically generated API documentation:Swagger UI: http://127.0.0.1:8000/docsReDoc: http://127.0.0.1:8000/redocContributing(Section on how others can contribute)License(Information about the project's license)This README provides a comprehensive guide to setting up and running your FastAPI backend, including the crucial steps for managing environment-specific configurations using .env files.
