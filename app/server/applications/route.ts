import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AppStatus = 'Pending' | 'Under Review' | 'Accepted' | 'Rejected';

interface ApplicationRow {
  id: number;
  student_id: string;
  student_name: string;
  college_id: number;
  college_name: string;
  program: string;
  status: AppStatus;
  applied_date: string;
  updated_at: string;
  documents: unknown;
  notes: string | null;
}


function normalizeDocuments(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, url: null as string | null };
      }

      if (item && typeof item === 'object') {
        const candidate = item as { name?: unknown; url?: unknown };
        const name = typeof candidate.name === 'string' ? candidate.name : '';
        if (!name) return null;
        const url = typeof candidate.url === 'string' ? candidate.url : null;
        return { name, url };
      }

      return null;
    })
    .filter((value): value is { name: string; url: string | null } => value !== null);
}

function mapApplication(row: ApplicationRow) {
  const docs = normalizeDocuments(row.documents);

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    collegeId: row.college_id,
    collegeName: row.college_name,
    program: row.program,
    status: row.status,
    appliedDate: row.applied_date,
    updatedAt: row.updated_at,
    documents: docs,
    notes: row.notes ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const collegeId = searchParams.get('collegeId');
    const status = searchParams.get('status');

    if (id) {
      let single = supabase.from('applications').select('*').eq('id', parseInt(id, 10));
      if (profile.role === 'student') {
        single = single.eq('student_id', user.id);
      }
      const { data, error } = await single.maybeSingle();
      if (error) {
        console.error('applications GET:', error);
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      return NextResponse.json(mapApplication(data as ApplicationRow));
    }

    let query = supabase.from('applications').select('*').order('id', { ascending: true });

    if (profile.role === 'student') {
      query = query.eq('student_id', user.id);
    } else if (profile.role === 'school_rep') {
      const { data: repProfile, error: repProfileError } = await supabase
        .from('profiles')
        .select('college_id')
        .eq('id', user.id)
        .maybeSingle();

      if (repProfileError || !repProfile || repProfile.college_id == null) {
        return NextResponse.json({ error: 'School representative profile is missing college scope' }, { status: 403 });
      }

      query = query.eq('college_id', repProfile.college_id);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('applications GET:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    let list = (rows ?? []) as ApplicationRow[];

    if (collegeId) {
      list = list.filter((a) => a.college_id === parseInt(collegeId, 10));
    }
    if (status) {
      const s = status.toLowerCase();
      list = list.filter((a) => a.status.toLowerCase() === s);
    }

    return NextResponse.json(list.map(mapApplication));
  } catch (e) {
    console.error('applications GET:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server misconfigured' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can create applications' }, { status: 403 });
    }

    const body = await request.json();
    const { collegeId, collegeName, program } = body;
    const documents = Array.isArray(body.documents) ? body.documents : [];

    if (!collegeId || !collegeName || !program) {
      return NextResponse.json(
        { error: 'College ID, college name, and program are required' },
        { status: 400 }
      );
    }

    const { data: existing, error: exErr } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', user.id)
      .eq('college_id', collegeId)
      .eq('program', program)
      .maybeSingle();

    if (exErr) {
      console.error('applications POST duplicate check:', exErr);
      return NextResponse.json({ error: 'Failed to validate application' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Student has already applied to this program at this college' },
        { status: 409 }
      );
    }

    const studentName = (profile.full_name as string)?.trim() || 'Student';

    const { data: inserted, error } = await supabase
      .from('applications')
      .insert({
        student_id: user.id,
        student_name: studentName,
        college_id: collegeId,
        college_name: collegeName,
        program,
        status: 'Pending',
        documents,
      })
      .select('*')
      .single();

    if (error || !inserted) {
      console.error('applications POST:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json(mapApplication(inserted as ApplicationRow), { status: 201 });
  } catch (e) {
    console.error('applications POST:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server misconfigured' },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.documents !== undefined) patch.documents = body.documents;

    const { data: updated, error } = await supabase
      .from('applications')
      .update(patch)
      .eq('id', parseInt(id, 10))
      .select('*')
      .single();

    if (error) {
      console.error('applications PUT:', error);
      return NextResponse.json({ error: 'Application not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(mapApplication(updated as ApplicationRow));
  } catch (e) {
    console.error('applications PUT:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server misconfigured' },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const { data: deleted, error } = await supabase
      .from('applications')
      .delete()
      .eq('id', parseInt(id, 10))
      .select('*')
      .single();

    if (error || !deleted) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Application deleted successfully',
      deletedApplication: mapApplication(deleted as ApplicationRow),
    });
  } catch (e) {
    console.error('applications DELETE:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server misconfigured' },
      { status: 503 }
    );
  }
}
