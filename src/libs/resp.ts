import { ZodError } from 'zod'

import { headers } from '@/constants'

export class ApiResponse {
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

  static catch(error: any, statusCode: number = 403) {
    let message: string | string[] = error?.message || error?.statusText || 'Unknown an error occurred.'

    if (typeof error === 'string') {
      message = error
    } else {
      console.error(error)

      if (error instanceof ZodError && error.issues.length > 0) {
        message = error.issues.map(
          (iss) => `This field "${(iss.path as any[])[0]}": ${iss.message.toLowerCase()}`
        )
      }

      if (error?.status) {
        statusCode = error.status
      }
    }

    return this.message(message, statusCode)
  }
}
