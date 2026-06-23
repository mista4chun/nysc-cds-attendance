// scripts/seed-auth.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://iuzaiqtacjjxiedwubuj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1emFpcXRhY2pqeGllZHd1YnVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3MzE0OCwiZXhwIjoyMDk3MjQ5MTQ4fQ.6dCpVrWk762il736LXw3hhjrzwEKTzbeTO5GqduApyc'   // service role — never expose this client-side
)

const users = [
  { email: 'la-23a-0001@nysc-cds.internal', state_code: 'LA/23A/0001', role: 'clo' },
  { email: 'la-23a-0002@nysc-cds.internal', state_code: 'LA/23A/0002', role: 'clo' },
  { email: 'la-23a-0003@nysc-cds.internal', state_code: 'LA/23A/0003', role: 'lgi' },
  { email: 'la-23a-1001@nysc-cds.internal', state_code: 'LA/23A/1001', role: 'corps_member' },
  { email: 'la-23a-1002@nysc-cds.internal', state_code: 'LA/23A/1002', role: 'corps_member' },
  { email: 'la-23a-1003@nysc-cds.internal', state_code: 'LA/23A/1003', role: 'corps_member' },
  { email: 'la-23a-1004@nysc-cds.internal', state_code: 'LA/23A/1004', role: 'corps_member' },
  { email: 'la-23a-1005@nysc-cds.internal', state_code: 'LA/23A/1005', role: 'corps_member' },
  { email: 'la-23a-1006@nysc-cds.internal', state_code: 'LA/23A/1006', role: 'corps_member' },
  { email: 'la-23a-1007@nysc-cds.internal', state_code: 'LA/23A/1007', role: 'corps_member' },
  { email: 'la-23a-1008@nysc-cds.internal', state_code: 'LA/23A/1008', role: 'corps_member' },
  { email: 'la-23a-1009@nysc-cds.internal', state_code: 'LA/23A/1009', role: 'corps_member' },
  { email: 'la-23a-1010@nysc-cds.internal', state_code: 'LA/23A/1010', role: 'corps_member' },
  { email: 'la-23a-1011@nysc-cds.internal', state_code: 'LA/23A/1011', role: 'corps_member' },
  { email: 'la-23a-1012@nysc-cds.internal', state_code: 'LA/23A/1012', role: 'corps_member' },
  { email: 'la-23a-1013@nysc-cds.internal', state_code: 'LA/23A/1013', role: 'corps_member' },
  { email: 'la-23a-1014@nysc-cds.internal', state_code: 'LA/23A/1014', role: 'corps_member' },
  { email: 'la-23a-1015@nysc-cds.internal', state_code: 'LA/23A/1015', role: 'corps_member' },
  { email: 'la-23a-1016@nysc-cds.internal', state_code: 'LA/23A/1016', role: 'corps_member' },
  { email: 'la-23a-1017@nysc-cds.internal', state_code: 'LA/23A/1017', role: 'corps_member' },
  { email: 'la-23a-1018@nysc-cds.internal', state_code: 'LA/23A/1018', role: 'corps_member' },
  { email: 'la-23a-1019@nysc-cds.internal', state_code: 'LA/23A/1019', role: 'corps_member' },
  { email: 'la-23a-1020@nysc-cds.internal', state_code: 'LA/23A/1020', role: 'corps_member' },
]

const GROUP_IDS = {
  clo:          null,
  lgi:          null,
  corps_member: {
    'LA/23A/1001': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1002': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1003': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1004': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1005': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1006': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1007': '11111111-0000-0000-0000-000000000001',
    'LA/23A/1008': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1009': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1010': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1011': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1012': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1013': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1014': '11111111-0000-0000-0000-000000000002',
    'LA/23A/1015': '11111111-0000-0000-0000-000000000003',
    'LA/23A/1016': '11111111-0000-0000-0000-000000000003',
    'LA/23A/1017': '11111111-0000-0000-0000-000000000003',
    'LA/23A/1018': '11111111-0000-0000-0000-000000000003',
    'LA/23A/1019': '11111111-0000-0000-0000-000000000003',
    'LA/23A/1020': '11111111-0000-0000-0000-000000000003',
  }
}

async function seed() {
  console.log('Starting auth user creation via Admin API...\n')

  for (const u of users) {
    // 1. Create auth user via Admin API (GoTrue handles the hash)
    const { data, error } = await supabase.auth.admin.createUser({
      email:             u.email,
      password:          'Password123!',
      email_confirm:     true,
      user_metadata:     { role: u.role },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        // User exists — just update the password
        const { data: existing } = await supabase.auth.admin.listUsers()
        const found = existing?.users?.find(x => x.email === u.email)
        if (found) {
          await supabase.auth.admin.updateUserById(found.id, {
            password:      'Password123!',
            email_confirm: true,
          })
          console.log(`✓ Updated password: ${u.email}`)
        }
        continue
      }
      console.error(`✗ Failed ${u.email}:`, error.message)
      continue
    }

    console.log(`✓ Created: ${u.email} (${data.user.id})`)

    // 2. Upsert public.users row using the real auth UUID
    const groupId = u.role === 'corps_member'
      ? GROUP_IDS.corps_member[u.state_code]
      : null

    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id:           data.user.id,
        full_name:    getUserName(u.state_code),
        state_code:   u.state_code,
        phone_number: getPhone(u.state_code),
        role:         u.role,
        cds_group_id: groupId,
      }, { onConflict: 'state_code' })

    if (dbError) console.error(`  DB error for ${u.state_code}:`, dbError.message)
  }

  console.log('\nDone.')
}

function getUserName(code) {
  const names = {
    'LA/23A/0001': 'Amina Bello',
    'LA/23A/0002': 'Chukwudi Okafor',
    'LA/23A/0003': 'Fatima Al-Hassan',
    'LA/23A/1001': 'Adaeze Okonkwo',
    'LA/23A/1002': 'Babatunde Adeyemi',
    'LA/23A/1003': 'Chisom Eze',
    'LA/23A/1004': 'Danladi Musa',
    'LA/23A/1005': 'Emeka Obi',
    'LA/23A/1006': 'Funmilayo Adesanya',
    'LA/23A/1007': 'Garba Yusuf',
    'LA/23A/1008': 'Hauwa Ibrahim',
    'LA/23A/1009': 'Ikenna Nwosu',
    'LA/23A/1010': 'Jumoke Fashola',
    'LA/23A/1011': 'Kelechi Nnadi',
    'LA/23A/1012': 'Lami Gusau',
    'LA/23A/1013': 'Mohammed Sule',
    'LA/23A/1014': 'Ngozi Okafor',
    'LA/23A/1015': 'Oluwaseun Ajayi',
    'LA/23A/1016': 'Patience Udoh',
    'LA/23A/1017': 'Rotimi Adebayo',
    'LA/23A/1018': 'Salamatu Abdullahi',
    'LA/23A/1019': 'Tunde Bakare',
    'LA/23A/1020': 'Uche Nwofor',
  }
  return names[code] ?? code
}

function getPhone(code) {
  const last4 = code.split('/')[2]
  return `0803200${last4.slice(-4)}`
}

seed().catch(console.error)