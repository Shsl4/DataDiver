FROM python:3.10-slim

RUN apt update && apt install curl git -y
RUN curl -fsSL https://ollama.com/install.sh | sh

ADD scripts/pull_models.sh .
RUN chmod +x pull_models.sh && ./pull_models.sh
RUN rm -f pull_models.sh

SHELL ["/bin/bash", "-c"]

ENV VIRTUAL_ENV=/run/ai_env
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ADD requirements.txt .
RUN pip install chromadb==0.5.5 --no-deps
RUN pip install -r requirements.txt 
RUN rm -f requirements.txt

ADD scripts/pull_retrievers.py .
RUN python ./pull_retrievers.py
RUN rm -f pull_retrievers.py

WORKDIR /run

ADD db db
ADD src src
ADD scripts/run.sh .
ADD resources resources
RUN chmod +x run.sh

ENV DOCKER Yes

CMD ["bash", "./run.sh"]
