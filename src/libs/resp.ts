import { ZodError } from 'zod'

import { headers } from '@/constants'

export class ApiResponse {
  /**
   * The function `json` returns a JSON response with optional status code and headers in TypeScript.
   *
   * @param {any} data - The `data` parameter in the `json` function is used to pass the JSON data that you want to send in the response. This data can be any valid JSON object or value that you want to return to the client.
   * @param {number} [statusCode=200] - The `statusCode` parameter in the `json` function is used to specify the HTTP status code that will be returned in the response. By default, it is set to 200, which corresponds to the "OK" status code indicating that the request was successful.
   *
   * @returns The `json` method is being returned, which returns a JSON response with the provided data, status code, and headers.
   */
  static json(data: any, statusCode: number = 200) {
    return Response.json(data, { status: statusCode, headers })
  }

  static message(str: string | string[], statusCode: number = 200) {
    return Response.json(
      {
        statusCode,
        message: str
      },
      {
        status: statusCode,
        headers
      }
    )
  }

  /**
   * This static function catches errors and returns a message with a specified status code.
   *
   * @param {any} error - The `error` parameter in the `catch` function is used to capture any error that occurs during the execution of the code. It can be of any type, such as an Error object, a string, or any other data type. The function then processes this error to generate an appropriate error message
   * @param {number} [statusCode=403] - The `statusCode` parameter in the `catch` function is used to specify the HTTP status code to be returned in the response. By default, it is set to 403 (Forbidden), but it can be overridden by the `error` object if it contains a `status` property.
   *
   * @returns The `catch` function is returning the result of calling the `message` function with the `message` and `statusCode` as arguments.
   */
  static catch(error: any, statusCode: number = 403) {
    let message: string | string[] = error?.message || error?.statusText || 'Unknown an error occurred.'

    if (typeof error === 'string') {
      message = error
    } else {
      console.error(error)

      if (error instanceof ZodError && !error.isEmpty) {
        message = error.errors.map((err) => `This field "${err.path[0]}": ${err.message.toLowerCase()}`)
      }

      if (error?.status) {
        statusCode = error.status
      }
    }

    return this.message(message, statusCode)
  }
}
