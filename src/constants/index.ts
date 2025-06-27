import { Locales } from './enum'
import { ENV } from './env'

export const isBrowser = typeof window !== 'undefined'
export const isProduction = ENV.APP_MODE === 'production'
export const isDevelop = ENV.APP_MODE === 'development'
export const isLocal = ENV.APP_MODE === 'local'

export const APP_TOKEN = '__app_token__'
export const APP_LOCALE = '__app_locale__'
export const APP_THEME = '__app_theme__'

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
  [CONTENT_LANG]: Locales.UK
})

export const blockExplorerUrl = 'https://www.blockchain.com/explorer'
