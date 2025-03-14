#!/bin/bash

# Зупиняємо всі контейнери
docker compose down

# Видаляємо всі локальні зміни
git reset --hard HEAD
git clean -fd

# Оновлюємо код з репозиторію
git pull origin master

# Перезапускаємо контейнери
docker compose up --build -d