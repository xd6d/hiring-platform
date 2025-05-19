FROM python:3.11-alpine3.21

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /hiring-platform/backend

COPY requirements.txt .
RUN pip install -r requirements.txt

ENTRYPOINT python manage.py runserver 0.0.0.0:8000