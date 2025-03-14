#!/bin/bash

# Зупиняємо всі контейнери
docker compose down

git pull origin master

# Перезапускаємо контейнери
docker compose up --build -d