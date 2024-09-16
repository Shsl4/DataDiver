#!/bin/bash

ollama serve&

echo "[-] Waiting for Ollama server start..."
while [ "$(ollama list | grep 'NAME')" == "" ]; do
  sleep 1
done

echo "[+] Ollama server started"

python3 -O src/main.py
