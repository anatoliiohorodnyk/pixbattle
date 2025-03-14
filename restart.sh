#!/bin/bash

git pull
docker compose down --rmi server client
docker compose up --build -d server client