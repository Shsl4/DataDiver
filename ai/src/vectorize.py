import os
import sys
from threading import Lock

from colorama import Fore, Style
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pipeline import Pipeline
from config import Config

def vectorize_all(path: str):
    if not os.path.isdir(path):
        print(f"{Fore.RED}[-] The input path must be a directory{Style.RESET_ALL}")
        return

    lock = Lock()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=300)

    for retriever in Config.valid_retrievers:
        if retriever != "BAAI/bge-m3":
            print("skip")
            continue
        print(f"{Fore.CYAN}[*] Vectorizing {path} documents with size {Config.retrievers[retriever].embeddings_size}{Style.RESET_ALL}")
        vectorstore = Pipeline.make_vectorstore(retriever)
        Pipeline.load_all_pdfs(path, lock, splitter, vectorstore)

def vectorize_single(file: str):
    if not os.path.isfile(file):
        print(f"{Fore.RED}[-] The input path must be a file{Style.RESET_ALL}")
        return

    if not file.endswith(".pdf"):
        print(f"{Fore.RED}[-] The provided file is not a pdf file{Style.RESET_ALL}")
        return
    
    lock = Lock()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=300)

    for retriever in Config.valid_retrievers:
        print(f"{Fore.CYAN}[*] Vectorizing {file} with size {Config.retrievers[retriever].embeddings_size}{Style.RESET_ALL}")
        vectorstore = Pipeline.make_vectorstore(retriever)
        Pipeline.load_single_pdf(file, lock, splitter, vectorstore)

def main():
    if len(sys.argv) != 3:
        print("Usage: python vectorize.py --single | --recurse <pdf_file | dir_path>")
        return
    
    flag = sys.argv[1]
    path = sys.argv[2]
    
    match flag:
        case "--single":
            pass
        case "--recurse":
            vectorize_all(path)
        case _:
            print(f"{Fore.RED}[-] Invalid flag. It must either be --single or --recurse{Style.RESET_ALL}")
            return
        
if __name__ == '__main__':
    main()