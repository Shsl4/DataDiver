from pipeline import Pipeline
from web_handler import WebHandler


def main():
    WebHandler("ai_service", Pipeline()).run()

if __name__ == "__main__":
    main()
