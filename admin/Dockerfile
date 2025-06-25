# Use the official Python 3.8 image with Alpine Linux
FROM python:3.8-alpine

# Set environment variables to prevent Python from writing pyc files and buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apk update && \
    apk add --no-cache mariadb-connector-c-dev build-base

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8080
EXPOSE 1002

# Command to run the Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:1002"]
