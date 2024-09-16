# DataDiver

This project is a PoC of Retrieval Augmented Generation (RAG) usage in the domain of cybersecurity. It demonstrates how RAG can be used to have conversations, or rate user texts on specialized subjects such as Cybersecurity.

DataDiver uses a Kestrel as a web server with a React frontend, LangChain, Sentence Transformers and Ollama for the AI service, ChromaDB for storing embeddings, and MongoDB for storing the histories and configurations.

This repo comes pre-packaged with vectorized databases using the documents available in ai/resources.

#### ⚠️ Running AI on your computer requires demanding hardware. This project is setup to use Nvidia GPUs, and the CPU if none are available. If you wish to use another GPU brand, please refer to the Docker Compose documentation.

## Building

### Docker

This project can be run using Docker. To get started, install Docker and Docker Compose for your target platform. Installation tutorials are made available by Docker for [Windows](https://docs.docker.com/desktop/install/windows-install/), [macOS](https://docs.docker.com/desktop/install/mac-install/), and [Linux](https://docs.docker.com/desktop/install/linux-install/).

Once installed clone the repository, move to its directory and build the Docker image using Docker Compose:

```sh
git clone https://github.com/Shsl4/DataDiver
cd DataDiver
docker compose build
```

The Compose stack pulls a MongoDB image, builds the web server and the AI service. When building the AI service, Docker will automatically pre-download 3 LLM Models (Mistral, Phi3 and Llama 3.1) as well as 3 document retriever models (BAAI/bge-m3, sentence-transformers/all-mpnet-base-v2, and sentence-transformers/all-MiniLM-L12-v2).

#### ⚠️ Building the image can take a significant amount of time and heavily depends on your internet connection and hardware. The final image size will be around 25 GB.

Once built, you can then run the Docker image using:

```
docker compose up
```
This will automatically start up all services. You then be able to connect to the web server using port 8000 (HTTP) and 8001 (HTTPS). HSTS is enabled by default. Note that the AI service and the database are not exposed by default. You can adjust the Compose configuration manually if you wish to expose them.

This project uses a self signed certificate, so you will have to trust it in your browser in order to use the app. Otherwise, use your own certificate or generate a development self-signed certificate (requires the [dotnet SDK](https://learn.microsoft.com/en-us/dotnet/core/install/windows)) using:

```sh
dotnet dev-certs https -ep cert.pfx -p mypassword
dotnet dev-certs https --trust
```

You should place your certificate in the root of the web directory and name it cert.pfx (otherwise, change the certificate name in the web Dockerfile). Once the certificate is replaced, you will need to build the image again.

### Vector database creation

In order to use RAG, you will need to populate a database using your own documents. The app comes with a convenience script to automatically convert PDFs into a vector database. It is recommended that you place your documents in ai/resources/pdf. 

To use it, move to the ai directory and use the following command: 

```sh
# Move to ai directory
cd ai

# Vectorize all documents recursively in directory
python src/vectorize.py --recurse dir_path

# Vectorize a single document
python src/vectorize.py --single my_document.pdf
```

This script will automatically create 3 vector databases with embeddings of size 384, 768 and 1024 in the ./db directory. Note that the db directory must be placed in the ai directory in order for it to be recognized.