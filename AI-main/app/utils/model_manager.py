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
    except Exception as e:
        logger.error(f"❌ Failed to download the file - {name}: {str(e)}")
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

    try:
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to_path)
        logger.info(f"✅ The file has been successfully extracted to the {extract_to_path} folder.")
    except Exception as e:
        logger.error(f"❌ Failed to extract {zip_file_path}: {str(e)}")

def download_model():
    try:
        # 디렉토리 생성
        os.makedirs(RESOUERCES_DIR, exist_ok=True)
        
        # 데이터 정보 파일 경로
        data_json = os.path.join(RESOUERCES_DIR, "data_info.json")
        
        # 파일이 없으면 모델 다운로드 건너뛰기
        if not os.path.isfile(data_json):
            logger.warning("⚠️ data_info.json file not found. Skipping model download.")
            return
        
        # 파일 읽기 시도
        try:
            data_dict = json.load(open(data_json, encoding='utf-8'))
        except Exception as e:
            logger.error(f"❌ Failed to load data_info.json: {str(e)}")
            return
        
        # 모델 목록 확인
        if 'model_list' not in data_dict or not data_dict['model_list']:
            logger.warning("⚠️ No models defined in data_info.json. Skipping model download.")
            return
        
        # 모델 다운로드 (gdown 오류 시 무시)
        for model in data_dict['model_list']:
            try:
                file_name = os.path.join(RESOUERCES_DIR, model['name'])
                if not os.path.isfile(file_name):
                    model_download(file_name, model['id'])
                    unzip_file(file_name)
            except Exception as e:
                logger.error(f"❌ Error processing model {model.get('name', 'unknown')}: {str(e)}")
                
    except Exception as e:
        logger.error(f"❌ Error in download_model: {str(e)}")
        logger.info("⚠️ Continuing without model download...")
