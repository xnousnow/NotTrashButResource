import processImage from './processImage'

import type {
  ImageModeRequest,
  TextModeRequest,
  ObjectsResponse,
  ErrorResponse,
  GuideResponse,
  InfoResponse,
  Response as APIResponse
} from '$routes/api/guide/types'

async function parseNDJSONStream<T extends object>(response: Response, onObject: (obj: T) => void) {
  if (!response.body) {
    console.error('ReadableStream not supported in this environment.')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')

      buffer = lines.pop() || ''

      for (let line of lines) {
        line = line.trim()
        if (line) {
          try {
            const obj = JSON.parse(line)
            onObject(obj)
          } catch (err) {
            console.error(err)
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer.trim())
        onObject(obj)
      } catch (err) {
        console.error(err)
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    reader.releaseLock()
  }
}

export const useAPI = async (
  request: (Omit<ImageModeRequest, 'image'> & { image: File }) | TextModeRequest,
  handleObjects: (objects: ObjectsResponse['data']['objects']) => void,
  handleGuides: (guides: GuideResponse['data']['guide']) => void,
  handleError: (error: ErrorResponse['data']) => void,
  handleInfo: (info: InfoResponse['data']) => void,
  close: () => void
) => {
  try {
    let response: Response

    if ('image' in request) {
      const processedImage = await processImage(request.image, 512, 512)

      response = await fetch('/api/guide/image', {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          image: processedImage
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    } else if ('query' in request) {
      response = await fetch('/api/guide/text', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      throw new Error('Invalid request')
    }

    if (response.status === 200) {
      await parseNDJSONStream<APIResponse>(response, (obj: APIResponse) => {
        switch (obj.type) {
          case 'objects':
            handleObjects(obj.data.objects)
            break
          case 'guide':
            handleGuides(obj.data.guide)
            break
          case 'error':
            handleError(obj.data)
            break
          case 'info':
            handleInfo(obj.data)
            break
        }
      })
    } else {
      const errorResponse: ErrorResponse = {
        type: 'error',
        data: {
          error: true,
          errors: {
            server: true
          }
        }
      }

      handleError(errorResponse.data)
    }
  } catch (error) {
    console.error(error)
    const errorResponse: ErrorResponse = {
      type: 'error',
      data: {
        error: true,
        errors: {
          other: true
        }
      }
    }

    handleError(errorResponse.data)
  } finally {
    close()
  }
}
