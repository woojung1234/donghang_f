import gdown
import zipfile
import os
import json

from ..core import logger
from .const import RESOUERCES_DIR

def model_download(name: str, id: str) -> str:
    logger.info("📌 Starting model download...")
    
    file_name = None
    try:
        file_name = gdown.download(id=id, output=name, quiet=False)
        print(file_name)
        logger.info(f"✅ Downloaded {file_name}")
    except gdown.exceptions.FileURLRetrievalError as e:
        logger.error(f"❌ Failed to download the file - {name}")
        pass
    
    return file_name

def unzip_file(zip_file_path, extract_to_path=None):
    """
    주어진 zip 파일의 압축을 푸는 함수.

    :param zip_file_path: 압축을 풀 zip 파일의 경로
    :param extract_to_path: 압축을 풀 폴더의 경로 (기본값: zip 파일과 동일한 위치에 동일한 이름의 폴더)
    """
    if extract_to_path is None:
        extract_to_path = os.path.splitext(zip_file_path)[0]

    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to_path)

    logger.info(f"✅ The file has been successfully extracted to the {extract_to_path} folder.")

def download_model():
    os.makedirs(RESOUERCES_DIR, exist_ok=True)
    data_json = os.path.join(RESOUERCES_DIR, "data_info.json")
    data_dict = json.load(open(data_json, encoding = 'utf-8'))

    for model in data_dict['model_list']:
        file_name = os.path.join(RESOUERCES_DIR, model['name'])
        if not os.path.isfile(file_name):
            model_download(file_name, model['id'])
            unzip_file(file_name)
