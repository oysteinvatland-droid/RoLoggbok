import type { BoatType, BoatStatus, MemberRole, AgeCategory, SeriousnessType } from '@/types'

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  '1x':     'Singlesculler (1x)',
  '1x pl':  'Singlesculler plastbåt (1x pl)',
  '1xC':    'Coastal singlesculler (1xC)',
  '1xTR':   'Turbåt singel (1xTR)',
  '2x':     'Dobbeltsculler (2x)',
  '2xC':    'Coastal dobbeltsculler (2xC)',
  '2xTR':   'Turbåt dobbelt (2xTR)',
  '2-':     'Toer uten styrmann (2-)',
  '2x/2-':  'Toer scull/sweep (2x/2-)',
  '4x/4-':  'Firer scull/sweep (4x/4-)',
  '4x':     'Dobbel firer scull (4x)',
  '4-':     'Firer uten styrmann (4-)',
  '4+':     'Firer med styrmann (4+)',
  '5x/4x+': 'Kombibåt (5x/4x+)',
  '8+':     'Åtter med styrmann (8+)',
  'innr':   'Innrigger',
}

export const BOAT_TYPE_CREW_SIZE: Record<BoatType, number> = {
  '1x':     1,
  '1x pl':  1,
  '1xC':    1,
  '1xTR':   1,
  '2x':     2,
  '2xC':    2,
  '2xTR':   2,
  '2-':     2,
  '2x/2-':  2,
  '4x/4-':  4,
  '4x':     4,
  '4-':     4,
  '4+':     5,
  '5x/4x+': 5,
  '8+':     9,
  'innr':   1,
}

export const BOAT_STATUS_LABELS: Record<BoatStatus, string> = {
  available:   'Tilgjengelig',
  on_water:    'På vannet',
  maintenance: 'Vedlikehold',
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

export const ALL_BOAT_TYPES: BoatType[] = [
  '1x', '1x pl', '1xC', '1xTR',
  '2x', '2xC', '2xTR', '2-', '2x/2-',
  '4x/4-', '4x', '4-', '4+', '5x/4x+',
  '8+', 'innr',
]

export const ALL_AGE_CATEGORIES: AgeCategory[] = ['J10', 'J12', 'J14', 'J16', 'J18', 'Senior']
export const ALL_SERIOUSNESS: SeriousnessType[] = ['recreational', 'competitor']
export const ALL_ROLES: MemberRole[] = ['rower', 'coach', 'admin']
