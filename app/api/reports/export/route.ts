// app/api/reports/export/route.ts
// GET /api/reports/export?type=pdf|excel&period=daily|weekly|monthly&group_id=uuid&date=YYYY-MM-DD

import { createClient }              from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF                          from 'jspdf'
import autoTable                      from 'jspdf-autotable'
import * as XLSX                      from 'xlsx'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['clo', 'lgi'].includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')     ?? 'pdf'    // pdf | excel
  const period   = searchParams.get('period')   ?? 'monthly' // daily | weekly | monthly
  const groupId  = searchParams.get('group_id') ?? ''
  const dateStr  = searchParams.get('date')     ?? new Date().toISOString().split('T')[0]

  // ── Date range from period ────────────────────────────────
  const date = new Date(dateStr)
  let startDate: Date
  let endDate:   Date
  let periodLabel: string

  if (period === 'daily') {
    startDate   = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    endDate     = new Date(date)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  } else if (period === 'weekly') {
    const day   = date.getDay()
    startDate   = new Date(date)
    startDate.setDate(date.getDate() - day)
    startDate.setHours(0, 0, 0, 0)
    endDate     = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = `Week of ${startDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
  } else {
    startDate   = new Date(date.getFullYear(), date.getMonth(), 1)
    endDate     = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    periodLabel = date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
  }

  // ── Fetch attendance data ─────────────────────────────────
  let sessionsQuery = supabase
    .from('attendance_sessions')
    .select('id, title, start_time, location_name, cds_group_id, cds_groups(name)')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time')

  if (groupId) sessionsQuery = sessionsQuery.eq('cds_group_id', groupId)

  const { data: sessions } = await sessionsQuery

  if (!sessions || sessions.length === 0) {
    return NextResponse.json(
      { error: 'No sessions found for this period' },
      { status: 404 }
    )
  }

  const sessionIds = sessions.map(s => s.id)

  const { data: records } = await supabase
    .from('attendance_records')
    .select('session_id, user_id, attendance_status, timestamp, users(full_name, state_code)')
    .in('session_id', sessionIds)
    .order('timestamp')

  // ── Summary stats ─────────────────────────────────────────
  const { data: summary } = await supabase
    .from('v_current_month_attendance')
    .select('user_id, full_name, state_code, group_name, attendance_pct, present_count, sessions_held, cleared')
    .order('attendance_pct', { ascending: true })

  const { data: groups } = await supabase
    .from('v_group_attendance')
    .select('name, member_count, total_sessions, avg_attendance_pct')
    .order('name')

  const totalCheckins = records?.filter(r => r.attendance_status === 'present').length  ?? 0
  const totalExcused  = records?.filter(r => r.attendance_status === 'excused').length   ?? 0
  const totalAbsent   = records?.filter(r => r.attendance_status === 'absent').length    ?? 0
  const groupName     = groupId
    ? (groups?.find(g => g.name) ?? groups?.[0])?.name ?? 'All Groups'
    : 'All Groups'

  const reportTitle = `NYSC CDS Attendance Report — ${periodLabel}`
  const generatedAt = new Date().toLocaleString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  // ══════════════════════════════════════════════════════════
  // PDF GENERATION
  // ══════════════════════════════════════════════════════════
  if (type === 'pdf') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageW  = doc.internal.pageSize.getWidth()
    const green  = [0, 100, 0]   as [number, number, number]
    const dark   = [30, 30, 30]  as [number, number, number]
    const gray   = [120, 120, 120] as [number, number, number]
    const light  = [245, 248, 245] as [number, number, number]

    // Header band
    doc.setFillColor(...green)
    doc.rect(0, 0, pageW, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('NYSC CDS ATTENDANCE REPORT', 14, 11)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(periodLabel, 14, 18)
    doc.text(`Generated: ${generatedAt}`, 14, 23)
    doc.text(groupName, pageW - 14, 18, { align: 'right' })

    // Summary KPI boxes
    let y = 36
    doc.setTextColor(...dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, y)
    y += 5

    const kpis = [
      { label: 'Sessions',     value: String(sessions.length) },
      { label: 'Present',      value: String(totalCheckins)   },
      { label: 'Excused',      value: String(totalExcused)    },
      { label: 'Absent',       value: String(totalAbsent)     },
    ]
    const boxW = (pageW - 28) / 4
    kpis.forEach((k, i) => {
      const x = 14 + i * (boxW + 2)
      doc.setFillColor(...light)
      doc.roundedRect(x, y, boxW, 14, 2, 2, 'F')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...green)
      doc.text(k.value, x + boxW / 2, y + 8, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...gray)
      doc.text(k.label, x + boxW / 2, y + 12.5, { align: 'center' })
    })
    y += 22

    // ── Section 1: Sessions ───────────────────────────────
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text('Sessions', 14, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Session', 'Group', 'Date', 'Location', 'Present', 'Excused', 'Absent']],
      body: sessions.map(s => {
        const sRecords = records?.filter(r => r.session_id === s.id) ?? []
        const p = sRecords.filter(r => r.attendance_status === 'present').length
        const e = sRecords.filter(r => r.attendance_status === 'excused').length
        const a = sRecords.filter(r => r.attendance_status === 'absent').length
        return [
          s.title,
          (s.cds_groups as any)?.name ?? '—',
          new Date(s.start_time).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }),
          s.location_name,
          String(p),
          String(e),
          String(a),
        ]
      }),
      styles:        { fontSize: 8, cellPadding: 2 },
      headStyles:    { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 253, 250] },
      columnStyles:  { 0: { cellWidth: 40 }, 1: { cellWidth: 28 }, 2: { cellWidth: 24 }, 3: { cellWidth: 35 } },
      margin:        { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 8

    // ── Section 2: Group comparison ───────────────────────
    if (!groupId && groups && groups.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...dark)
      doc.text('Group Attendance Comparison', 14, y)
      y += 3

      autoTable(doc, {
        startY: y,
        head: [['CDS Group', 'Members', 'Sessions', 'Avg Attendance']],
        body: groups.map(g => [
          g.name,
          String(g.member_count ?? 0),
          String(g.total_sessions ?? 0),
          `${g.avg_attendance_pct ?? 0}%`,
        ]),
        styles:      { fontSize: 8, cellPadding: 2 },
        headStyles:  { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 253, 250] },
        margin:      { left: 14, right: 14 },
      })

      y = (doc as any).lastAutoTable.finalY + 8
    }

    // ── Section 3: Defaulters ─────────────────────────────
    const defaulters = (summary ?? []).filter(s => (s.attendance_pct ?? 0) < 75)
    if (defaulters.length > 0) {
      // Check if we need a new page
      if (y > 220) { doc.addPage(); y = 20 }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...dark)
      doc.text(`Attendance Defaulters (${defaulters.length} members below 75%)`, 14, y)
      y += 3

      autoTable(doc, {
        startY: y,
        head: [['Full Name', 'State Code', 'Group', 'Attendance %', 'Clearance']],
        body: defaulters.map(d => [
          d.full_name,
          d.state_code,
          d.group_name ?? '—',
          `${d.attendance_pct ?? 0}%`,
          d.cleared ? 'Eligible' : 'Not eligible',
        ]),
        styles:      { fontSize: 8, cellPadding: 2 },
        headStyles:  { fillColor: [180, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 250, 250] },
        margin:      { left: 14, right: 14 },
      })
    }

    // Footer on every page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(...gray)
      doc.text(
        `NYSC CDS Attendance System — Confidential — Page ${i} of ${pageCount}`,
        pageW / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    const pdfBytes = doc.output('arraybuffer')
    const filename = `nysc-attendance-${period}-${dateStr}.pdf`

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // ══════════════════════════════════════════════════════════
  // EXCEL GENERATION
  // ══════════════════════════════════════════════════════════
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────
  const summaryData = [
    ['NYSC CDS ATTENDANCE REPORT'],
    [periodLabel],
    [`Generated: ${generatedAt}`],
    [''],
    ['SUMMARY'],
    ['Total Sessions', sessions.length],
    ['Total Present',  totalCheckins],
    ['Total Excused',  totalExcused],
    ['Total Absent',   totalAbsent],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // ── Sheet 2: Sessions ─────────────────────────────────────
  const sessionsData = [
    ['Session Title', 'Group', 'Date', 'Location', 'Present', 'Excused', 'Absent', 'Total', 'Attendance %'],
    ...sessions.map(s => {
      const sRecords = records?.filter(r => r.session_id === s.id) ?? []
      const p     = sRecords.filter(r => r.attendance_status === 'present').length
      const e     = sRecords.filter(r => r.attendance_status === 'excused').length
      const a     = sRecords.filter(r => r.attendance_status === 'absent').length
      const total = p + e + a
      return [
        s.title,
        (s.cds_groups as any)?.name ?? '—',
        new Date(s.start_time).toLocaleDateString('en-NG'),
        s.location_name,
        p, e, a,
        total,
        total > 0 ? `${Math.round(((p + e) / total) * 100)}%` : '0%',
      ]
    }),
  ]
  const wsSessions = XLSX.utils.aoa_to_sheet(sessionsData)
  wsSessions['!cols'] = [
    { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Sessions')

  // ── Sheet 3: Full attendance records ──────────────────────
  const recordsData = [
    ['Full Name', 'State Code', 'Group', 'Session', 'Date', 'Status', 'Check-in Time'],
    ...(records ?? []).map(r => {
      const session = sessions.find(s => s.id === r.session_id)
      return [
        (r.users as any)?.full_name  ?? '—',
        (r.users as any)?.state_code ?? '—',
        (session?.cds_groups as any)?.name ?? '—',
        session?.title ?? '—',
        session ? new Date(session.start_time).toLocaleDateString('en-NG') : '—',
        r.attendance_status.charAt(0).toUpperCase() + r.attendance_status.slice(1),
        new Date(r.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      ]
    }),
  ]
  const wsRecords = XLSX.utils.aoa_to_sheet(recordsData)
  wsRecords['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 20 },
    { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsRecords, 'Attendance Records')

  // ── Sheet 4: Member summary ───────────────────────────────
  if (summary && summary.length > 0) {
    const memberData = [
      ['Full Name', 'State Code', 'Group', 'Sessions', 'Present', 'Attendance %', 'Clearance Eligible'],
      ...summary.map(m => [
        m.full_name,
        m.state_code,
        m.group_name ?? '—',
        m.sessions_held,
        m.present_count,
        `${m.attendance_pct ?? 0}%`,
        m.cleared ? 'Yes' : 'No',
      ]),
    ]
    const wsMember = XLSX.utils.aoa_to_sheet(memberData)
    wsMember['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, wsMember, 'Member Summary')
  }

  // ── Sheet 5: Defaulters ───────────────────────────────────
  const defaulters = (summary ?? []).filter(s => (s.attendance_pct ?? 0) < 75)
  if (defaulters.length > 0) {
    const defaultersData = [
      ['Full Name', 'State Code', 'Group', 'Attendance %', 'Clearance Status'],
      ...defaulters.map(d => [
        d.full_name,
        d.state_code,
        d.group_name ?? '—',
        `${d.attendance_pct ?? 0}%`,
        d.cleared ? 'Eligible' : 'Not Eligible',
      ]),
    ]
    const wsDefaulters = XLSX.utils.aoa_to_sheet(defaultersData)
    wsDefaulters['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, wsDefaulters, 'Defaulters')
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  const filename    = `nysc-attendance-${period}-${dateStr}.xlsx`

  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}