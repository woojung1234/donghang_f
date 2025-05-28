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
    return Object.keys(params)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
      .join('&');
  };

  let options = {
    headers: headers,
    url: process.env.REACT_APP_API_URL + api,
    method: method,
    mode: 'cors', // CORS 모드 추가
    credentials: 'include', // 쿠키를 포함한 요청 활성화
    body: method !== 'GET' ? JSON.stringify(request) : null,
  };

  // GET 요청인 경우 쿼리 문자열을 URL에 추가
  if (method === 'GET' && request) {
    options.url += '?' + buildQueryString(request);
  }

  console.log(`API 요청: ${method} ${options.url}`);

  //비동기통신: axios, ajax, fetch, promise...
  return fetch(options.url, options)
  .then((response) => {
    console.log(`API 응답 상태: ${response.status}`);
    const contentType = response.headers.get("content-type");

    //헤더에 값이 있으면 로컬 스토리지에 ACCESS TOKEN 저장하기
    if(response.headers.get("authorization")){
      localStorage.setItem("ACCESS_TOKEN", response.headers.get("authorization"));
    }
    
    // 응답이 JSON 형식인지 확인
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json().then((json) => {
        if (!response.ok) {
          return Promise.reject(json);
        }
        return json;
      });
    } else if (contentType && contentType.indexOf("text/plain") !== -1) {
      // 응답이 텍스트 형식인 경우 처리
      return response.text().then((text) => {
        if (!response.ok) {
          return Promise.reject(text);
        }
        return text;
      });
    } else {
      // 예상치 못한 Content-Type의 경우
      if (!response.ok) {
        return Promise.reject(`Error ${response.status}: ${response.statusText}`);
      }
      return {};
    }
  })
  .catch((error) => {
    console.error("API 호출 오류:", error);
    // error.status가 undefined인 경우를 처리
    if (error && (error.status === undefined || error.status === 403)) {
     // window.location.href = "/login"; // redirect
    }
    return Promise.reject(error);
  });
}

// default export 추가
export default {
  call
};
