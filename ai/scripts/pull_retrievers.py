from transformers import AutoModel


def main():
    retrievers: list[str] = ["BAAI/bge-m3", "sentence-transformers/all-mpnet-base-v2",
                             "sentence-transformers/all-MiniLM-L12-v2"]

    for retriever in retrievers:
        print(f"[*] Downloading {retriever}", flush=True)
        AutoModel.from_pretrained(retriever)

    print("[+] Done!", flush=True)


if __name__ == "__main__":
    main()
