import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const ACCESS_TOKEN_KEY = "access";
export const ACCESS_TOKEN_LIFE = 1;
export const REFRESH_TOKEN_KEY = "refresh";
const CSRF_TOKEN_KEY = "csrftoken";
const AUTH_URLS = [
  "/auth/login/",
  "/auth/refresh_token/",
  "/auth/register/worker/",
];

export const apiInstance = axios.create({
  baseURL: "http://localhost:8000/api",
  // baseURL: "https://atlascolposcopy.ru/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

//Функции работы с куки
export function getCookie(name: string): string | null {
  // Декодируем URI и разбиваем на пары "ключ=значение"
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    // Разделяем имя и значение, значение содержит '=')
    const [cookieName, ...cookieValueParts] = cookie.split("=");
    const cookieValue = cookieValueParts.join("="); // Сбор обратно, если было несколько '='

    if (cookieName === name) {
      // Декодируем значение (токены часто кодируются)
      return decodeURIComponent(cookieValue);
    }
  }

  return null;
}

function setCookie(name: string, value: string, hours: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure=false`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// Функция для проверки, является ли URL аутентификационным
const isAuthUrl = (url: string) => {
  const normalizedUrl = url.startsWith("/") ? url.slice(1) : url;

  return AUTH_URLS.some((authPath) => {
    const normalizedAuthPath = authPath.startsWith("/")
      ? authPath.slice(1)
      : authPath;
    return normalizedUrl.includes(normalizedAuthPath);
  });
};

//Итерцептор запросов: добавляет Access Token в заголовки каждого запроса
apiInstance.interceptors.request.use(
  (config) => {
    const requestUrl = config.url;
    if (requestUrl) {
      if (!isAuthUrl(requestUrl)) {
        // 1. Логика Access Token
        const token = getCookie(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        // 2. Логика CSRF Token
        const csrfToken = getCookie(CSRF_TOKEN_KEY);

        if (csrfToken) {
          config.headers["X-CSRFtoken"] = csrfToken;
        }
      }
    } else {
      console.warn("Request URL is undefined", config);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор ответов: логика обновления токена и обработка ошибок 401
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest.url || "";

    if (
      error.response?.status === 401 &&
      !originalRequest._isRetry &&
      !isAuthUrl(requestUrl)
    ) {
      originalRequest._isRetry = true;

      // Проверяем наличие refresh-токена
      const hasRefreshToken = !!getCookie(REFRESH_TOKEN_KEY);
      if (!hasRefreshToken) {
        deleteCookie(ACCESS_TOKEN_KEY);
        deleteCookie(REFRESH_TOKEN_KEY);
        window.location.href = "/sign-in";
        return Promise.resolve({ data: null });
      }

      try {
        // Отправляем запрос на обновление
        const resp = await apiInstance.post("/auth/refresh_token/");
        setCookie("access", resp.data.access, ACCESS_TOKEN_LIFE);

        return apiInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed, logging out:", refreshError);
        deleteCookie(ACCESS_TOKEN_KEY);
        deleteCookie(REFRESH_TOKEN_KEY);
        window.location.href = "/sign-in";
        return Promise.resolve({ data: null });
      }
    }

    return Promise.reject(error);
  }
);

export const createInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return apiInstance({
    ...config,
    ...options,
  }).then((r) => r.data);
};

export type RequestOptions = Parameters<typeof createInstance>[1];

export type BodyType<Data> = Data;

export type ErrorType<Error> = AxiosError<Error>;

/*
 * Этот модуль создаёт и экспортирует универсальную обёртку для работы с API с помощью Axios.
 * * apiInstance: Экземпляр Axios с централизованными настройками, такими как базовый URL ("/api")
 * и заголовки по умолчанию ("Content-Type": "application/json"). Это позволяет избежать
 * дублирования кода в каждом запросе.
 *
 * createInstance: Основная функция для выполнения запросов. Она принимает конфигурацию
 * запроса и опции, объединяет их и отправляет через apiInstance. Функция возвращает
 * только полезные данные из ответа (r.data), а не весь объект ответа.
 *
 * BodyType: Вспомогательный дженерик-тип для типизации тела запросов.
 *
 * ErrorType: Вспомогательный дженерик-тип для удобной работы с ошибками Axios,
 * предоставляя доступ к деталям, таким как статус-код.
 */
