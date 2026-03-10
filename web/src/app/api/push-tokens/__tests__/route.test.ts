/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

describe('Push Tokens API', () => {
  describe('GET /api/push-tokens', () => {
    it('should return success message', async () => {
      const req = new NextRequest('http://localhost:3000/api/push-tokens')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/push-tokens', () => {
    it('should echo back the body data', async () => {
      const mockBody = { token: 'ExponentPushToken[xyz]' }
      const req = new NextRequest('http://localhost:3000/api/push-tokens', {
        method: 'POST',
        body: JSON.stringify(mockBody)
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockBody)
    })
  })
})
