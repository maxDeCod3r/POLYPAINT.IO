FROM node:16.15.1-buster-slim

WORKDIR /app

ADD . .

EXPOSE 8081

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN npm install
RUN npm install pm2 -g

RUN source secrets/.env

CMD ["pm2-runtime", "server.js"]

# ENTRYPOINT [ "node", "index.js" ]
# ENTRYPOINT [ "gunicorn", "--bind", "0.0.0.0:8080", "server:app" ]
