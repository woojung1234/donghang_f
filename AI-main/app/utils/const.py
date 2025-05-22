import os

# model load
RESOUERCES_DIR = os.path.join("app", "resources")

# melo TTS
EN = {"language": "EN", "speaker": "EN-US"}
KR = {"language": "KR", "speaker": "KR", "path":"app/resources/MeloTTS_kr"}

OUTPUT_PATH = os.path.join("app", "static", "temp")
KR_MODEL_PATH = os.path.join(os.getcwd(), "app", "resources", "bert-kor-base")
