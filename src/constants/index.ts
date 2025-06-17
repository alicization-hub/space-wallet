
import { Locales } from './enum'
import { ENV } from './env'

export const isBrowser = typeof window !== 'undefined'
export const isProduction = ENV.APP_MODE === 'production'
export const isDevelop = ENV.APP_MODE === 'development'
export const isLocal = ENV.APP_MODE === 'local'

// STORAGE KEY-NAME
export const APP_AUTH_ACCESS = '__APP.AccessToken'
export const APP_AUTH_REFRESH = '__APP.RefreshKey'
export const APP_LOCALE = '__APP.Locale'
export const APP_THEME = '__APP.Theme'
export const APP_PLAYBACK = '__APP.Playback'

// REQUEST HEADERS
export const ACCEPT_LANG = 'Accept-Language'
export const ACCEPT_RANGES = 'Accept-Ranges'
export const CONTENT_LANG = 'Content-Language'
export const CONTENT_LENGTH = 'Content-Length'
export const CONTENT_RANGE = 'Content-Range'
export const CONTENT_TYPE = 'Content-Type'

export const headers = new Headers({
  'Access-Control-Allow-Origin': ENV.APP_BASE_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': `Authorization, ${CONTENT_TYPE}, ${CONTENT_LANG}`,
  [CONTENT_TYPE]: 'application/json',
  [CONTENT_LANG]: Locales.US
})
