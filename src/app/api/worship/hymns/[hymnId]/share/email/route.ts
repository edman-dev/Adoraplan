import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { hymnId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hymnId } = params;
    const { recipients, shareLink, message, hymnTitle } = await request.json();

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = recipients.filter((email: string) => emailRegex.test(email));

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses provided' },
        { status: 400 }
      );
    }

    // In production, integrate with email service (SendGrid, Resend, etc.)
    // For now, we'll simulate email sending
    console.log('Sending email invitations:', {
      from: userId,
      to: validEmails,
      subject: `Hymn Shared: ${hymnTitle}`,
      shareLink,
      message
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      sent: validEmails.length,
      recipients: validEmails
    });
  } catch (error) {
    console.error('Error sending email invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send email invitations' },
      { status: 500 }
    );
  }
}