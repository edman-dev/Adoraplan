import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

vi.mock('@/libs/DB', () => ({
  db: mockDb,
}));

// Mock the schema
vi.mock('@/models/WorshipSchema', () => ({
  churchesSchema: {
    id: 'id',
    name: 'name',
    organizationId: 'organizationId',
    description: 'description',
    address: 'address',
    contactEmail: 'contactEmail',
    contactPhone: 'contactPhone',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  },
}));

// Mock the middleware
vi.mock('@/middleware/worship-auth', () => ({
  withWorshipAuth: vi.fn((handler) => {
    return async (request: NextRequest, context?: any) => {
      // Mock authentication success
      const mockUser = { id: 'user-123' };
      const mockOrganization = { id: 'org-123' };
      return handler(request, { user: mockUser, organization: mockOrganization });
    };
  }),
}));

// Mock subscription limits
vi.mock('@/libs/worship/SubscriptionLimits', () => ({
  checkLimit: vi.fn(),
}));

// Mock Drizzle ORM functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
  count: vi.fn(),
}));

describe('/api/worship/churches', () => {
  const mockChurches = [
    {
      id: 1,
      organizationId: 'org-123',
      name: 'Main Church',
      description: 'Primary church location',
      address: '123 Main St',
      contactEmail: 'info@church.org',
      contactPhone: '555-0123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      deletedAt: null,
    },
    {
      id: 2,
      organizationId: 'org-123',
      name: 'Branch Church',
      description: 'Secondary location',
      address: '456 Oak Ave',
      contactEmail: 'branch@church.org',
      contactPhone: '555-0124',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/worship/churches', () => {
    it('returns churches for valid organization ID', async () => {
      mockDb.returning.mockResolvedValue(mockChurches);

      const request = new NextRequest('http://localhost:3000/api/worship/churches?organizationId=org-123');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockChurches);
    });

    it('returns 400 when organizationId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/worship/churches');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    it('handles database errors gracefully', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/worship/churches?organizationId=org-123');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve churches');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get churches:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('returns empty array when no churches found', async () => {
      mockDb.returning.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/worship/churches?organizationId=org-123');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe('POST /api/worship/churches', () => {
    const { checkLimit } = require('@/libs/worship/SubscriptionLimits');

    beforeEach(() => {
      checkLimit.mockReturnValue({
        allowed: true,
        current: 0,
        limit: 1,
      });
    });

    it('creates a new church successfully', async () => {
      const newChurch = {
        id: 3,
        organizationId: 'org-123',
        name: 'New Church',
        description: 'Test church',
        address: '789 New St',
        contactEmail: 'new@church.org',
        contactPhone: '555-0125',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
      };

      mockDb.returning.mockResolvedValue([newChurch]);

      const requestBody = {
        organizationId: 'org-123',
        name: 'New Church',
        description: 'Test church',
        address: '789 New St',
        contactEmail: 'new@church.org',
        contactPhone: '555-0125',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newChurch);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        organizationId: 'org-123',
        name: 'New Church',
        description: 'Test church',
        address: '789 New St',
        contactEmail: 'new@church.org',
        contactPhone: '555-0125',
        isActive: true,
      });
    });

    it('returns 400 when required fields are missing', async () => {
      const requestBody = {
        organizationId: 'org-123',
        // Missing name
        description: 'Test church',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID and name are required');
    });

    it('validates church name length', async () => {
      const requestBody = {
        organizationId: 'org-123',
        name: 'A', // Too short
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Church name must be between 2 and 100 characters');
    });

    it('validates email format when provided', async () => {
      const requestBody = {
        organizationId: 'org-123',
        name: 'Test Church',
        contactEmail: 'invalid-email',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Contact email must be a valid email address');
    });

    it('blocks creation when subscription limit is reached', async () => {
      checkLimit.mockReturnValue({
        allowed: false,
        current: 1,
        limit: 1,
        message: "You've reached the churches limit for your free plan (1/1)",
      });

      const requestBody = {
        organizationId: 'org-123',
        name: 'New Church',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe('Subscription limit reached');
      expect(data.code).toBe('LIMIT_EXCEEDED');
      expect(data.resource).toBe('churches');
    });

    it('handles database errors during creation', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database insert failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const requestBody = {
        organizationId: 'org-123',
        name: 'Test Church',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create church');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create church:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('trims whitespace from input fields', async () => {
      const newChurch = {
        id: 3,
        organizationId: 'org-123',
        name: 'Trimmed Church',
        description: 'Trimmed description',
        address: 'Trimmed address',
        contactEmail: 'trimmed@church.org',
        contactPhone: '555-0126',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
      };

      mockDb.returning.mockResolvedValue([newChurch]);

      const requestBody = {
        organizationId: 'org-123',
        name: '  Trimmed Church  ',
        description: '  Trimmed description  ',
        address: '  Trimmed address  ',
        contactEmail: '  trimmed@church.org  ',
        contactPhone: '  555-0126  ',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockDb.values).toHaveBeenCalledWith({
        organizationId: 'org-123',
        name: 'Trimmed Church',
        description: 'Trimmed description',
        address: 'Trimmed address',
        contactEmail: 'trimmed@church.org',
        contactPhone: '555-0126',
        isActive: true,
      });
    });

    it('handles optional fields correctly', async () => {
      const basicChurch = {
        id: 3,
        organizationId: 'org-123',
        name: 'Basic Church',
        description: null,
        address: null,
        contactEmail: null,
        contactPhone: null,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
      };

      mockDb.returning.mockResolvedValue([basicChurch]);

      const requestBody = {
        organizationId: 'org-123',
        name: 'Basic Church',
      };

      const request = new NextRequest('http://localhost:3000/api/worship/churches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDb.values).toHaveBeenCalledWith({
        organizationId: 'org-123',
        name: 'Basic Church',
        description: null,
        address: null,
        contactEmail: null,
        contactPhone: null,
        isActive: true,
      });
    });
  });
});