create table public.analysis_rate_limits (
  client_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key (client_hash, window_started_at),
  constraint analysis_rate_limits_client_hash_format check (client_hash ~ '^[0-9a-f]{64}$'),
  constraint analysis_rate_limits_request_count_positive check (request_count > 0)
);

create index analysis_rate_limits_window_started_at_idx
  on public.analysis_rate_limits (window_started_at);

alter table public.analysis_rate_limits enable row level security;
alter table public.analysis_rate_limits force row level security;

revoke all on table public.analysis_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.analysis_rate_limits to service_role;

create function public.consume_analysis_quota(
  p_client_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid client hash' using errcode = '22023';
  end if;

  if p_limit < 1 or p_limit > 100 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid quota configuration' using errcode = '22023';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  delete from public.analysis_rate_limits
  where window_started_at < v_now - interval '2 days';

  insert into public.analysis_rate_limits as limits (
    client_hash,
    window_started_at,
    request_count
  )
  values (p_client_hash, v_window_started_at, 1)
  on conflict (client_hash, window_started_at)
  do update
    set request_count = limits.request_count + 1
    where limits.request_count < p_limit
  returning limits.request_count into v_request_count;

  if found then
    return query select true, 0;
  else
    return query select
      false,
      greatest(
        1,
        ceil(extract(epoch from (v_window_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer
      );
  end if;
end;
$$;

revoke all on function public.consume_analysis_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_analysis_quota(text, integer, integer) to service_role;
