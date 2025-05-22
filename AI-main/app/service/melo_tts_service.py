import soundfile as sf
import os
import io

from app.melo_my.api import TTS
from app.utils.preprcessing import preprocess_text
from app.utils.const import KR

model = TTS(language=KR["language"], 
            device='cpu',
            config_path=os.path.join(KR["path"], "config.json"),
            ckpt_path=os.path.join(KR["path"], "checkpoint.pth")
            )
speaker_ids = model.hps.data.spk2id

def convert_text_to_speech(contents: str):
    try:
        audio = model.tts_to_file(preprocess_text(contents), speaker_ids[KR["speaker"]], output_path=None)
        
        # 메모리 내에 오디오 데이터를 저장하기 위한 버퍼 생성
        buffer = io.BytesIO()
        
        # 오디오 데이터를 버퍼에 저장 (WAV 형식으로)
        sf.write(buffer, audio, model.hps.data.sampling_rate, format='WAV')
        
        # 버퍼의 포인터를 시작 부분으로 재설정
        buffer.seek(0)
        
        # StreamingResponse로 반환
        return buffer
    except Exception as e:
        return {"error": str(e)}