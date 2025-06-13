import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { hymnsSchema as hymnTable } from '@/models/WorshipSchema';
import { withWorshipAuth } from '@/middleware/worship-auth';
import { eq, and, or, like, desc, isNull, inArray } from 'drizzle-orm';

/**
 * GET /api/worship/hymns
 * Get all hymns accessible to the current user and organization
 */
async function handleGetHymns(request: NextRequest, { user, organization }: { user: any; organization: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const doctrine = searchParams.get('doctrine');
    const theme = searchParams.get('theme');
    const language = searchParams.get('language');
    const hymnType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build where conditions
    const whereConditions = [];

    // Include official hymns, public hymns, and user's organization hymns
    whereConditions.push(
      or(
        eq(hymnTable.hymnType, 'official'),
        eq(hymnTable.hymnType, 'public'),
        and(
          eq(hymnTable.organizationId, organizationId),
          eq(hymnTable.hymnType, 'user_created')
        )
      )
    );

    // Filter by search term
    if (search) {
      whereConditions.push(
        or(
          like(hymnTable.title, `%${search}%`),
          like(hymnTable.author, `%${search}%`),
          like(hymnTable.categories, `%${search}%`),
          like(hymnTable.doctrines, `%${search}%`),
          like(hymnTable.themes, `%${search}%`)
        )
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      whereConditions.push(like(hymnTable.categories, `%${category}%`));
    }

    // Filter by doctrine
    if (doctrine && doctrine !== 'all') {
      whereConditions.push(like(hymnTable.doctrines, `%${doctrine}%`));
    }

    // Filter by theme
    if (theme && theme !== 'all') {
      whereConditions.push(like(hymnTable.themes, `%${theme}%`));
    }

    // Filter by language
    if (language && language !== 'all') {
      whereConditions.push(like(hymnTable.languages, `%${language}%`));
    }

    // Filter by hymn type
    if (hymnType && hymnType !== 'all') {
      whereConditions.push(eq(hymnTable.hymnType, hymnType as 'official' | 'user_created' | 'public'));
    }

    // Get hymns using the existing schema structure
    const hymns = await db
      .select({
        id: hymnTable.id,
        title: hymnTable.title,
        author: hymnTable.author,
        composer: hymnTable.composer,
        year: hymnTable.year,
        copyright: hymnTable.copyright,
        type: hymnTable.hymnType,
        status: hymnTable.status,
        isPublic: hymnTable.isPublic,
        categories: hymnTable.categories,
        doctrines: hymnTable.doctrines,
        themes: hymnTable.themes,
        languages: hymnTable.languages,
        lyrics: hymnTable.lyrics,
        audioFiles: hymnTable.audioFiles,
        syncData: hymnTable.syncData,
        usageCount: hymnTable.usageCount,
        organizationId: hymnTable.organizationId,
        createdBy: hymnTable.createdBy,
        createdAt: hymnTable.createdAt,
        updatedAt: hymnTable.updatedAt,
      })
      .from(hymnTable)
      .where(and(...whereConditions))
      .orderBy(desc(hymnTable.updatedAt))
      .limit(limit)
      .offset(offset);

    // Process and structure the data
    const hymnData = hymns.map(hymn => ({
      ...hymn,
      categories: hymn.categories ? (typeof hymn.categories === 'string' ? JSON.parse(hymn.categories) : hymn.categories) : [],
      doctrines: hymn.doctrines ? (typeof hymn.doctrines === 'string' ? JSON.parse(hymn.doctrines) : hymn.doctrines) : [],
      themes: hymn.themes ? (typeof hymn.themes === 'string' ? JSON.parse(hymn.themes) : hymn.themes) : [],
      languages: hymn.languages ? (typeof hymn.languages === 'string' ? JSON.parse(hymn.languages) : hymn.languages) : [],
      lyrics: hymn.lyrics ? (typeof hymn.lyrics === 'string' ? JSON.parse(hymn.lyrics) : hymn.lyrics) : [],
      audioFiles: hymn.audioFiles ? (typeof hymn.audioFiles === 'string' ? JSON.parse(hymn.audioFiles) : hymn.audioFiles) : [],
      verses: hymn.lyrics ? (Array.isArray(hymn.lyrics) ? hymn.lyrics.length : Object.keys(hymn.lyrics || {}).length) : 0,
      likeCount: 0, // TODO: Implement user likes tracking
      isLiked: false, // TODO: Implement user likes tracking
    }));

    return NextResponse.json({
      success: true,
      data: hymnData,
      pagination: {
        limit,
        offset,
        total: hymns.length,
        hasMore: hymns.length === limit,
      },
    });
  } catch (error) {
    console.error('Failed to get hymns:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve hymns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worship/hymns
 * Create a new hymn
 */
async function handleCreateHymn(request: NextRequest, { user, organization }: { user: any; organization: any }) {
  try {
    const body = await request.json();
    const {
      organizationId,
      title,
      author,
      composer,
      year,
      copyright,
      hymnType = 'user_created',
      isPublic = false,
      categories = [],
      doctrines = [],
      themes = [],
      languages = ['en'],
      lyrics = {},
      audioFiles = [],
    } = body;

    if (!organizationId || !title || !author) {
      return NextResponse.json(
        { error: 'Organization ID, title, and author are required' },
        { status: 400 }
      );
    }

    // Validate input
    if (title.length < 1 || title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be between 1 and 255 characters' },
        { status: 400 }
      );
    }

    if (author.length < 1 || author.length > 255) {
      return NextResponse.json(
        { error: 'Author must be between 1 and 255 characters' },
        { status: 400 }
      );
    }

    if (composer && composer.length > 255) {
      return NextResponse.json(
        { error: 'Composer must be less than 255 characters' },
        { status: 400 }
      );
    }

    if (year && (year < 1 || year > new Date().getFullYear() + 10)) {
      return NextResponse.json(
        { error: 'Year must be a valid year' },
        { status: 400 }
      );
    }

    if (languages.length === 0) {
      return NextResponse.json(
        { error: 'At least one language is required' },
        { status: 400 }
      );
    }

    // Validate that there are lyrics for at least one language
    const hasLyrics = languages.some(lang => lyrics[lang]?.trim());
    if (!hasLyrics) {
      return NextResponse.json(
        { error: 'Lyrics are required for at least one language' },
        { status: 400 }
      );
    }

    // Create the hymn using the existing schema structure
    const [newHymn] = await db
      .insert(hymnTable)
      .values({
        title: title.trim(),
        author: author.trim(),
        composer: composer?.trim() || null,
        year: year || null,
        copyright: copyright?.trim() || null,
        hymnType: hymnType as 'user_created' | 'public',
        status: 'not_reviewed',
        isPublic,
        categories: categories,
        doctrines: doctrines,
        themes: themes,
        languages: languages,
        lyrics: lyrics,
        audioFiles: audioFiles,
        organizationId,
        createdBy: user.id,
      })
      .returning();

    // Return the created hymn with processed arrays
    const responseHymn = {
      ...newHymn,
      type: newHymn.hymnType,
      categories: categories,
      doctrines: doctrines,
      themes: themes,
      languages: languages,
      audioFiles: audioFiles,
      lyrics: lyrics,
      verses: lyrics ? Object.keys(lyrics).filter(lang => lyrics[lang]?.trim()).length : 0,
      likeCount: 0,
      isLiked: false,
    };

    return NextResponse.json({
      success: true,
      data: responseHymn,
    });
  } catch (error) {
    console.error('Failed to create hymn:', error);
    return NextResponse.json(
      { error: 'Failed to create hymn' },
      { status: 500 }
    );
  }
}

// Apply worship auth middleware
export const GET = withWorshipAuth(handleGetHymns, {
  permission: 'canViewHymns',
});

export const POST = withWorshipAuth(handleCreateHymn, {
  permission: 'canManageHymns',
});