# Використовуємо офіційний nginx образ з Alpine
FROM nginx:alpine

# Видаляємо дефолтну конфігурацію nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копіюємо нашу конфігурацію
COPY nginx.conf /etc/nginx/conf.d

# Копіюємо статичні файли
COPY . /usr/share/nginx/html

# Відкриваємо порт 80
EXPOSE 80

# Запускаємо nginx у foreground режимі
CMD ["nginx", "-g", "daemon off;"]