FROM node:16.15.1-buster-slim
ADD . .
EXPOSE 8081
RUN npm install package.json
RUN source secrets/.env
ENTRYPOINT [ "node", "index.js" ]
# ENTRYPOINT [ "gunicorn", "--bind", "0.0.0.0:8080", "server:app" ]
