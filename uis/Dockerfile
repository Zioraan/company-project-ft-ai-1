FROM node:20-alpine

WORKDIR /app

COPY website/package.json website/package-lock.json ./website/
RUN cd website && npm ci

COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN cd backoffice && npm ci

COPY website/ ./website/
COPY backoffice/ ./backoffice/
COPY start.sh /app/start.sh
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000 3001

CMD ["sh", "/app/start.sh"]
