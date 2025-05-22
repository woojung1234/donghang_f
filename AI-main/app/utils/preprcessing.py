from datetime import datetime
import re
import os

from ..utils.const import OUTPUT_PATH

def preprocess_text(text):
    text = re.sub(r'[^\w\s]', '', text)

    text = re.sub(r'\s+', ' ', text)

    text = text.strip()
    
    return text

def make_output_path():
    output_name = datetime.now().strftime("%Y%m%d_%H%M%S") + ".wav"
    output_path = os.path.join(OUTPUT_PATH, output_name)
    return output_path