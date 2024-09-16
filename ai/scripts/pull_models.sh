#!/bin/bash

ollama serve &

while [ "$(ollama list | grep 'NAME')" == "" ]; do
  sleep 1
done

ollama pull mistral
ollama pull phi3
ollama pull llama3.1