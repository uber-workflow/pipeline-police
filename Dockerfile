FROM uber/web-base-image:12.13.0

WORKDIR /pipeline-police

COPY package.json yarn.lock /pipeline-police/

RUN yarn
