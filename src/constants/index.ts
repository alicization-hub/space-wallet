import { ENV } from "./env"

export const isBrowser = typeof window !== "undefined"
export const isProduction = ENV.APP_MODE === "production"
export const isDevelop = ENV.APP_MODE === "development"
export const isLocal = ENV.APP_MODE === "local"

export const APP_LOCALE = "__app_locale__"
export const APP_THEME = "__app_theme__"

export const ACCEPT_LANG = "Accept-Language"
export const ACCEPT_RANGES = "Accept-Ranges"
export const CONTENT_LANG = "Content-Language"
export const CONTENT_LENGTH = "Content-Length"
export const CONTENT_RANGE = "Content-Range"
export const CONTENT_TYPE = "Content-Type"

export const BLOCK_EXPLORER_URL = "https://www.blockchain.com/explorer"
