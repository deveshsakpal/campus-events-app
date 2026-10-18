# Multi-stage Dockerfile for Flutter Web on Render
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# Copy dependency specifications and resolve
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy source code and build Flutter web
COPY . .
ARG API_BASE_URL=http://localhost:8080
RUN flutter build web --release --dart-define=API_BASE_URL=${API_BASE_URL}

# Production server stage
FROM nginx:alpine

COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=80
EXPOSE 80

CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
