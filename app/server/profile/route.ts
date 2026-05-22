import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type CollegeEmbed = {
  id?: number;
  name: string;
  description?: string;
  location?: string;
} | {
  id?: number;
  name: string;
  description?: string;
  location?: string;
}[] | null;

function collegeFromEmbed(embed: CollegeEmbed | undefined) {
  if (!embed) return null;
  if (Array.isArray(embed)) return embed[0] ?? null;
  return embed;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        full_name,
        role,
        description,
        college_id,
        colleges ( id, name, description, location )
      `
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const row = profile as {
      id: string;
      username: string;
      full_name: string;
      role: string;
      description: string;
      college_id: number | null;
      colleges?: CollegeEmbed;
    };

    const college = collegeFromEmbed(row.colleges);

    return NextResponse.json({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      status: row.role === 'student' ? 'Active Student' : row.role === 'school_rep' ? 'Active School Representative' : 'Active Admin',
      collegeId: row.college_id,
      collegeName: college?.name ?? null,
      description: row.description ?? '',
      address: '',
      avatarUrl: null,
      collegeDescription: college?.description ?? '',
      collegeAddress: college?.location ?? '',
      collegeLogoUrl: null,
      email: user.email ?? '',
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server misconfigured' },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: userError } = await supabase.auth.getUser();
    const user = authData.user;

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const {
      fullName,
      description,
      address,
      avatarUrl,
      schoolName,
      schoolDescription,
      schoolAddress,
      schoolLogoUrl,
      email,
      password,
    } = payload as Record<string, string | undefined>;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, college_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updates: Record<string, string | null> = {};
    if (typeof fullName === 'string') updates.full_name = fullName.trim();
    if (typeof description === 'string') updates.description = description.trim();
    if (typeof address === 'string') updates.address = address.trim();
    if (typeof avatarUrl === 'string') updates.avatar_url = avatarUrl.trim() || null;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (profile.role === 'school_rep' && profile.college_id) {
      const collegeUpdates: Record<string, string | null> = {};
      if (typeof schoolName === 'string') collegeUpdates.name = schoolName.trim();
      if (typeof schoolDescription === 'string') collegeUpdates.description = schoolDescription.trim();
      if (typeof schoolAddress === 'string') collegeUpdates.location = schoolAddress.trim();
      if (typeof schoolLogoUrl === 'string') collegeUpdates.logo_url = schoolLogoUrl.trim() || null;

      if (Object.keys(collegeUpdates).length > 0) {
        const { error } = await supabase.from('colleges').update(collegeUpdates).eq('id', profile.college_id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (typeof email === 'string' && email.trim() && email.trim() !== user.email) {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (typeof password === 'string' && password.trim()) {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Request failed' }, { status: 400 });
  }
}
