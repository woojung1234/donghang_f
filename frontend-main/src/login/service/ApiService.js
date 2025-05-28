export function call(api, method, request) {
  let headers = new Headers({
    "Content-Type": "application/json",
  });

  // 로컬 스토리지에서 ACCESS TOKEN 가져오기
  const accessToken = localStorage.getItem("ACCESS_TOKEN");
  if (accessToken && accessToken !== null) {
    headers.append("Authorization", "Bearer " + accessToken);
  }

  // 쿼리 문자열을 생성하는 함수
  const buildQueryString = (params) => {
    if (!params || typeof params !== 'object') return '';
    return Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
      .join('&');
  };

  // API URL 구성
  let apiUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + api : api;
  
  // GET 요청인 경우 쿼리 문자열을 URL에 추가
  if (method === 'GET' && request) {
    const queryString = buildQueryString(request);
    if (queryString) {
      apiUrl += '?' + queryString;
    }
  }

  let options = {
    headers: headers,
    method: method,
    mode: 'cors', // CORS 모드 추가
    credentials: 'include', // 쿠키를 포함한 요청 활성화
  };

  // GET이 아닌 경우에만 body 추가
  if (method !== 'GET' && request) {
    options.body = JSON.stringify(request);
  }

  console.log(`API 요청: ${method} ${apiUrl}`);
  if (request && method !== 'GET') {
    console.log('요청 데이터:', request);
  }

  //비동기통신: axios, ajax, fetch, promise...
  return fetch(apiUrl, options)
  .then((response) => {
    console.log(`API 응답 상태: ${response.status}`);
    
    // 응답 헤더에서 Authorization 토큰 확인 및 저장
    const authHeader = response.headers.get("Authorization") || response.headers.get("authorization");
    if (authHeader) {
      localStorage.setItem("ACCESS_TOKEN", authHeader.replace("Bearer ", ""));
    }

    const contentType = response.headers.get("content-type");
    
    // 응답이 JSON 형식인지 확인
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json().then((json) => {
        if (!response.ok) {
          console.error('API 에러 응답:', json);
          return Promise.reject({
            status: response.status,
            statusText: response.statusText,
            data: json
          });
        }
        return json;
      });
    } else if (contentType && contentType.indexOf("text/plain") !== -1) {
      // 응답이 텍스트 형식인 경우 처리
      return response.text().then((text) => {
        if (!response.ok) {
          console.error('API 에러 응답 (텍스트):', text);
          return Promise.reject({
            status: response.status,
            statusText: response.statusText,
            data: text
          });
        }
        return text;
      });
    } else {
      // 예상치 못한 Content-Type의 경우
      if (!response.ok) {
        console.error(`API 에러: ${response.status} ${response.statusText}`);
        return Promise.reject({
          status: response.status,
          statusText: response.statusText,
          data: `Error ${response.status}: ${response.statusText}`
        });
      }
      return {};
    }
  })
  .catch((error) => {
    console.error("API 호출 오류:", error);
    
    // 네트워크 에러나 기타 에러 처리
    if (!error.status) {
      // 네트워크 에러인 경우
      error = {
        status: 0,
        statusText: 'Network Error',
        data: error.message || '네트워크 연결을 확인해주세요.'
      };
    }
    
    // 인증 에러 처리
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("ACCESS_TOKEN");
      // window.location.href = "/login"; // 필요시 주석 해제
    }
    
    return Promise.reject(error);
  });
}

// default export 추가
export default {
  call
};
