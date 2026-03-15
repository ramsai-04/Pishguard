FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY src/ml/training/requirements.runtime.txt ./requirements.txt
RUN python3 -m venv "$VIRTUAL_ENV" \
  && pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/venv /opt/venv
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/ml/models ./src/ml/models
COPY --from=build /app/src/ml/training/predict_xgboost.py ./src/ml/training/predict_xgboost.py

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:deploy && npm run start"]
