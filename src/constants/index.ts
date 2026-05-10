import type { BoatStatus, MemberRole, AgeCategory, SeriousnessType } from '@/types'

export const BOAT_STATUS_LABELS: Record<BoatStatus, string> = {
  available:   'Tilgjengelig',
  on_water:    'På vannet',
  maintenance: 'Vedlikehold',
  away:        'På tur/regatta',
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  rower: 'Roer',
  coach: 'Trener',
  admin: 'Administrator',
}

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  J10:    'Junior 10',
  J12:    'Junior 12',
  J14:    'Junior 14',
  J16:    'Junior 16',
  J18:    'Junior 18',
  Senior: 'Senior',
}

export const SERIOUSNESS_LABELS: Record<SeriousnessType, string> = {
  recreational: 'Mosjonist',
  competitor:   'Konkurrerende',
}

export const ALL_AGE_CATEGORIES: AgeCategory[] = ['J10', 'J12', 'J14', 'J16', 'J18', 'Senior']
export const ALL_SERIOUSNESS: SeriousnessType[] = ['recreational', 'competitor']
export const ALL_ROLES: MemberRole[] = ['rower', 'coach', 'admin']
