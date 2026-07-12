/**
 * Gjenbrukbare SELECT-fragmenter som bygger de samme nøstede formene frontend fikk
 * fra PostgREST-joinene. Hver returnerer relasjoner som JSON-kolonner, slik at
 * eksisterende TS-typer (Boat.boat_type, SessionWithDetails.members, osv.) passer uendret.
 */

export const BOAT_SELECT = `
  select
    b.*,
    (
      select row_to_json(bt) from (
        select t.*,
          (select row_to_json(f) from boat_type_filters f where f.id = t.filter_id) as filter
        from boat_types t where t.id = b.boat_type_id
      ) bt
    ) as boat_type,
    (select row_to_json(tm)  from teams tm  where tm.id  = b.team_id)           as team,
    (select row_to_json(tm2) from teams tm2 where tm2.id = b.secondary_team_id) as secondary_team
  from boats b
`

export const BOAT_TYPE_SELECT = `
  select t.*,
    (select row_to_json(f) from boat_type_filters f where f.id = t.filter_id) as filter
  from boat_types t
`

export const SESSION_DETAIL_SELECT = `
  select
    s.*,
    (select row_to_json(b) from boats  b where b.id = s.boat_id)  as boat,
    (select row_to_json(r) from routes r where r.id = s.route_id) as route,
    coalesce((
      select json_agg(mm order by mm.seat_number nulls last, mm.name)
      from (
        select m.*, sm.seat_number
        from members m
        join session_members sm on sm.member_id = m.id
        where sm.session_id = s.id
      ) mm
    ), '[]'::json) as members,
    (
      select row_to_json(i) from (
        select * from incidents i2 where i2.session_id = s.id order by i2.created_at limit 1
      ) i
    ) as incident
  from sessions s
`
