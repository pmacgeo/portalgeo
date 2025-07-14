FROM php:8.2-fpm-alpine

# Extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html
# COPY public /var/www/html
# COPY --from=public . .

EXPOSE 9000
CMD ["php-fpm"]
