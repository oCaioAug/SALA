/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prismaMock } from '../../../../../prisma/mock'
import * as recurringReservations from '@/lib/recurringReservations'
import { notificationService } from '@/lib/notifications'

// Mock notification service
jest.mock('@/lib/notifications', () => ({
  notificationService: {
    reservationCreated: jest.fn(),
  }
}))

// Mock recurring reservations logic since we already unit tested it
jest.mock('@/lib/recurringReservations', () => ({
  generateRecurringDates: jest.fn(),
  checkRecurringConflicts: jest.fn(),
  generateRecurringReservations: jest.fn(),
}))

describe('Reservations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/reservations', () => {
    it('should return reservations with given filters', async () => {
      const mockReservations = [{ id: 'res-1', roomId: 'room-1' }]
      prismaMock.reservation.findMany.mockResolvedValue(mockReservations as any)

      const req = new NextRequest('http://localhost:3000/api/reservations?roomId=room-1&status=APPROVED')
      
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockReservations)
      expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
        where: { roomId: 'room-1', status: 'APPROVED' },
        include: { user: true, room: true },
        orderBy: { startTime: 'desc' }
      })
    })
  })

  describe('POST /api/reservations', () => {
    const validBaseBody = {
      userId: 'user-1',
      roomId: 'room-1',
      startTime: new Date('2024-01-01T10:00:00').toISOString(),
      endTime: new Date('2024-01-01T12:00:00').toISOString(),
      purpose: 'Reunião',
    }

    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' } as any)
      prismaMock.room.findUnique.mockResolvedValue({ id: 'room-1' } as any)
    })

    it('should fail if missing required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId: 'room-1' }) // Missing userId, startTime, endTime
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Todos os campos obrigatórios devem ser preenchidos')
    })

    it('should create a single reservation successfully', async () => {
      prismaMock.reservation.findFirst.mockResolvedValue(null) // No conflicts
      prismaMock.reservation.create.mockResolvedValue({ id: 'new-res', ...validBaseBody, status: 'PENDING' } as any)

      const req = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ ...validBaseBody, isRecurring: false })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-res')
      expect(prismaMock.reservation.create).toHaveBeenCalled()
      expect(notificationService.reservationCreated).toHaveBeenCalled()
    })

    it('should fail if there is a conflict for single reservation', async () => {
      prismaMock.reservation.findFirst.mockResolvedValue({
        id: 'conflict',
        startTime: new Date('2024-01-01T10:30:00'),
        endTime: new Date('2024-01-01T11:30:00'),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ ...validBaseBody, isRecurring: false })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('já está reservada neste horário')
    })

    it('should process recurring reservations successfully', async () => {
      // Mock recurring dates generation
      const mockDates = [{ startTime: new Date(), endTime: new Date() }]
      ;(recurringReservations.generateRecurringDates as jest.Mock).mockReturnValue(mockDates)
      ;(recurringReservations.checkRecurringConflicts as jest.Mock).mockResolvedValue([]) // No conflicts
      ;(recurringReservations.generateRecurringReservations as jest.Mock).mockResolvedValue(['res-1', 'res-2'])
      
      prismaMock.reservation.findMany.mockResolvedValue([
        { id: 'res-1' },
        { id: 'res-2' }
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ 
          ...validBaseBody, 
          isRecurring: true,
          recurringPattern: 'DAILY',
          recurringEndDate: new Date('2024-01-05T23:59:59').toISOString()
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.isRecurring).toBe(true)
      expect(data.recurringInstances).toBe(2)
      expect(recurringReservations.checkRecurringConflicts).toHaveBeenCalledWith('room-1', mockDates)
      expect(recurringReservations.generateRecurringReservations).toHaveBeenCalled()
    })

    it('should fail recurring reservation if conflicts exist', async () => {
       const mockDates = [{ startTime: new Date(), endTime: new Date() }]
      ;(recurringReservations.generateRecurringDates as jest.Mock).mockReturnValue(mockDates)
      ;(recurringReservations.checkRecurringConflicts as jest.Mock).mockResolvedValue([
        { startTime: mockDates[0].startTime, endTime: mockDates[0].endTime, conflict: { id: 'bad' } }
      ])
      
      prismaMock.reservation.findFirst.mockResolvedValue({
        id: 'conflicting-res',
        startTime: new Date(),
        endTime: new Date(),
        status: 'ACTIVE',
        user: { name: 'João', email: 'joao@example.com' }
      } as any)

      const req = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ 
          ...validBaseBody, 
          isRecurring: true,
          recurringPattern: 'DAILY',
          recurringEndDate: new Date('2024-01-05T23:59:59').toISOString()
        })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('A sala já está reservada em alguns horários da recorrência')
      expect(data.conflictCount).toBe(1)
    })
  })
})
