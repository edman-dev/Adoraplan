import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

// Mock the schema
vi.mock('@/models/WorshipSchema', () => ({
  churchesSchema: {
    id: 'id',
    name: 'name',
    organizationId: 'organizationId',
    isActive: 'isActive',
    deletedAt: 'deletedAt',
  },
  ministriesSchema: {
    id: 'id',
    churchId: 'churchId',
    isActive: 'isActive',
  },
  servicesSchema: {
    id: 'id',
    name: 'name',
    ministryId: 'ministryId',
    isActive: 'isActive',
  },
  eventsSchema: {
    id: 'id',
  },
  usersSchema: {
    id: 'id',
  },
}));

// Mock the middleware
vi.mock('@/middleware/worship-auth', () => ({
  withWorshipAuth: vi.fn((handler, options) => {
    return async (request: NextRequest) => {
      // Mock authentication check
      if (options?.minimumRole === 'admin') {
        // Simulate admin check
        return handler(request);
      }
      return handler(request);
    };
  }),
}));

// Mock Drizzle ORM functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  count: vi.fn(() => 'count()'),
  gte: vi.fn(),
  lte: vi.fn(),
  isNull: vi.fn(),
  desc: vi.fn(),
}));

describe('/api/worship/admin/stats', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementation
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
    mockDb.leftJoin.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.groupBy.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when organizationId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Organization ID is required');
  });

  it('returns organizational statistics successfully', async () => {
    // Mock database responses
    const { db } = await import('@/libs/DB');
    
    // Mock church statistics
    (db.select as any).mockReturnValueOnce([{ total: 2 }]); // Total churches
    (db.select as any).mockReturnValueOnce([{ count: 1 }]); // Active churches
    
    // Mock ministry statistics  
    (db.select as any).mockReturnValueOnce([{ total: 5 }]); // Total ministries
    (db.select as any).mockReturnValueOnce([{ count: 4 }]); // Active ministries
    
    // Mock ministries by church
    (db.select as any).mockReturnValueOnce([
      { churchName: 'Main Church', count: 3 },
      { churchName: 'Branch Church', count: 1 },
    ]);
    
    // Mock service statistics
    (db.select as any).mockReturnValueOnce([{ total: 8 }]); // Total services
    
    // Mock services by type
    (db.select as any).mockReturnValueOnce([
      { type: 'Sunday Service', count: 4 },
      { type: 'Prayer Meeting', count: 4 },
    ]);

    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      churches: {
        total: 2,
        active: 1,
        inactive: 1,
      },
      ministries: {
        total: 5,
        active: 4,
        byChurch: [
          { churchName: 'Main Church', count: 3 },
          { churchName: 'Branch Church', count: 1 },
        ],
      },
      services: {
        total: 8,
        byType: [
          { type: 'Sunday Service', count: 4 },
          { type: 'Prayer Meeting', count: 4 },
        ],
      },
      users: {
        totalCollaborators: 5,
        byRole: expect.any(Array),
        recentActivity: [],
      },
    });
  });

  it('handles different time periods correctly', async () => {
    const { db } = await import('@/libs/DB');
    
    // Mock responses for 7d period
    (db.select as any).mockReturnValue([{ total: 1 }]);
    
    const request7d = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123&period=7d');
    
    const response7d = await GET(request7d);
    const data7d = await response7d.json();

    expect(response7d.status).toBe(200);
    expect(data7d.period).toBe('7d');
    expect(data7d.dateRange).toBeDefined();
    expect(data7d.dateRange.start).toBeDefined();
    expect(data7d.dateRange.end).toBeDefined();

    // Test 1y period
    const request1y = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123&period=1y');
    
    const response1y = await GET(request1y);
    const data1y = await response1y.json();

    expect(response1y.status).toBe(200);
    expect(data1y.period).toBe('1y');
  });

  it('defaults to 30d period when not specified', async () => {
    const { db } = await import('@/libs/DB');
    
    // Mock minimal responses
    (db.select as any).mockReturnValue([{ total: 0 }]);
    
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period).toBe('30d');
  });

  it('calculates correct inactive church count', async () => {
    const { db } = await import('@/libs/DB');
    
    // Mock: 5 total churches, 3 active = 2 inactive
    (db.select as any)
      .mockReturnValueOnce([{ total: 5 }]) // Total churches
      .mockReturnValueOnce([{ count: 3 }]) // Active churches
      .mockReturnValue([{ total: 0 }]); // Other queries
    
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.churches.total).toBe(5);
    expect(data.data.churches.active).toBe(3);
    expect(data.data.churches.inactive).toBe(2);
  });

  it('handles database errors gracefully', async () => {
    const { db } = await import('@/libs/DB');
    
    // Mock database error
    (db.select as any).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to retrieve organizational statistics');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to get organizational stats:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('calculates mock service statistics correctly', async () => {
    const { db } = await import('@/libs/DB');
    
    // Mock 20 total services
    (db.select as any)
      .mockReturnValue([{ total: 0 }]) // Churches/ministries
      .mockReturnValueOnce([{ total: 20 }]) // Services
      .mockReturnValue([]);
    
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.services.total).toBe(20);
    expect(data.data.services.upcoming).toBe(6); // 30% of 20
    expect(data.data.services.thisWeek).toBe(3); // 15% of 20
  });

  it('includes proper date range in response', async () => {
    const { db } = await import('@/libs/DB');
    
    (db.select as any).mockReturnValue([{ total: 0 }]);
    
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123&period=90d');
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.dateRange).toBeDefined();
    expect(new Date(data.dateRange.start)).toBeInstanceOf(Date);
    expect(new Date(data.dateRange.end)).toBeInstanceOf(Date);
    
    // Check that the date range is approximately 90 days
    const startDate = new Date(data.dateRange.start);
    const endDate = new Date(data.dateRange.end);
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysDiff).toBeGreaterThanOrEqual(89);
    expect(daysDiff).toBeLessThanOrEqual(91);
  });

  it('returns consistent user statistics structure', async () => {
    const { db } = await import('@/libs/DB');
    
    (db.select as any).mockReturnValue([{ total: 0 }]);
    
    const request = new NextRequest('http://localhost:3000/api/worship/admin/stats?organizationId=org-123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.users).toMatchObject({
      totalCollaborators: 5,
      byRole: [
        { role: 'admin', count: 1 },
        { role: 'pastor', count: 1 },
        { role: 'worship_leader', count: 2 },
        { role: 'collaborator', count: 1 },
      ],
      recentActivity: [],
    });
  });
});