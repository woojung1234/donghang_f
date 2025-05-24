import gdown
import zipfile
import os
import json
import logging

from ..core import logger
from .const import RESOUERCES_DIR

def model_download(name: str, id: str) -> str:
    logger.info(f"📌 Starting model download for {name}...")
    
    file_name = None
    try:
        # Google Drive 다운로드 URL 직접 생성
        download_url = f"https://drive.google.com/uc?id={id}"
        
        # gdown으로 다운로드 시도
        file_name = gdown.download(id=id, output=name, quiet=False)
        logger.info(f"✅ Downloaded {file_name}")
        
        # 만약 gdown이 실패하면 파일이 존재하는지 확인
        if not file_name or not os.path.exists(name):
            logger.warning(f"⚠️ gdown failed to download. Please download manually from: {download_url}")
            logger.warning(f"⚠️ Save it as: {name}")
            # 파일이 존재하는지 재확인
            if os.path.exists(name):
                logger.info(f"✅ File already exists at {name}")
                file_name = name
    except Exception as e:
        logger.error(f"❌ Failed to download the file - {name}: {str(e)}")
        logger.warning(f"⚠️ Please download manually from: {download_url}")
        logger.warning(f"⚠️ Save it as: {name}")
        # 파일이 존재하는지 확인
        if os.path.exists(name):
            logger.info(f"✅ File already exists at {name}")
            file_name = name
    
    return file_name

def unzip_file(zip_file_path, extract_to_path=None):
    """
    주어진 zip 파일의 압축을 푸는 함수.

    :param zip_file_path: 압축을 풀 zip 파일의 경로
    :param extract_to_path: 압축을 풀 폴더의 경로 (기본값: zip 파일과 동일한 위치에 동일한 이름의 폴더)
    """
    if not os.path.exists(zip_file_path):
        logger.error(f"❌ Zip file not found: {zip_file_path}")
        return False
        
    if extract_to_path is None:
        extract_to_path = os.path.splitext(zip_file_path)[0]
    
    # 이미 압축 해제된 디렉토리가 있으면 건너뛰기
    if os.path.exists(extract_to_path) and os.path.isdir(extract_to_path):
        logger.info(f"✅ Directory already exists: {extract_to_path}, skipping extraction")
        return True

    try:
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to_path)
        logger.info(f"✅ The file has been successfully extracted to the {extract_to_path} folder.")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to extract {zip_file_path}: {str(e)}")
        return False

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
        success_count = 0
        for model in data_dict['model_list']:
            try:
                file_name = os.path.join(RESOUERCES_DIR, model['name'])
                model_dir = os.path.splitext(file_name)[0]
                
                # 이미 압축 해제된 디렉토리가 있으면 건너뛰기
                if os.path.exists(model_dir) and os.path.isdir(model_dir):
                    logger.info(f"✅ Model directory already exists: {model_dir}")
                    success_count += 1
                    continue
                
                # 다운로드 또는 기존 파일 확인
                if not os.path.isfile(file_name):
                    downloaded = model_download(file_name, model['id'])
                else:
                    logger.info(f"✅ Model file already exists: {file_name}")
                    downloaded = file_name
                
                # 압축 해제
                if downloaded:
                    if unzip_file(file_name):
                        success_count += 1
            except Exception as e:
                logger.error(f"❌ Error processing model {model.get('name', 'unknown')}: {str(e)}")
        
        if success_count > 0:
            logger.info(f"✅ Successfully processed {success_count} models")
        else:
            logger.warning("⚠️ No models were successfully processed")
                
    except Exception as e:
        logger.error(f"❌ Error in download_model: {str(e)}")
        logger.info("⚠️ Continuing without model download...")
