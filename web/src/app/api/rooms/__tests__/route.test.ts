/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prismaMock } from '../../../../../prisma/mock'

describe('Rooms API (List and Create)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET /api/rooms', () => {
    it('should return a list of rooms and use cache on subsequent calls', async () => {
      const mockRooms = [{ id: 'room-1', name: 'Sala 1' }]
      prismaMock.room.findMany.mockResolvedValue(mockRooms as any)

      // First call (hits DB)
      const req1 = new NextRequest('http://localhost:3000/api/rooms')
      const response1 = await GET()
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1).toEqual(mockRooms)
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(1)

      // Second call (should hit cache)
      const response2 = await GET()
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(1) // Still 1

      // Advance time beyond cache duration (2 mins)
      jest.advanceTimersByTime(3 * 60 * 1000)

      // Third call (should hit DB again)
      const response3 = await GET()
      expect(prismaMock.room.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('POST /api/rooms', () => {
    it('should validate required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ description: 'Sem nome' }) // Missing name
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Nome da sala é obrigatório')
    })

    it('should create a new room and invalidate cache', async () => {
      const mockRoom = { id: 'new-room', name: 'Sala Nova' }
      prismaMock.room.create.mockResolvedValue(mockRoom as any)

      const req = new NextRequest('http://localhost:3000/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ name: 'Sala Nova', capacity: '20' })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-room')
      expect(prismaMock.room.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Sala Nova', capacity: 20 })
        })
      )
    })
  })
})
