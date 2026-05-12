import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    const ctx = await requireUser(req);
    const rl = rateCheck('kudos-stats#get', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);
    const svc = serviceClient();

    const { data: kudos } = await svc.from('kudo').select('sender_id, receiver_id');
    const rows = (kudos ?? []) as { sender_id: string; receiver_id: string }[];
    const total_kudos = rows.length;
    const senders = new Set(rows.map((r) => r.sender_id));
    const receivers = new Set(rows.map((r) => r.receiver_id));

    const sendCount = new Map<string, number>();
    const recvCount = new Map<string, number>();
    for (const r of rows) {
      sendCount.set(r.sender_id, (sendCount.get(r.sender_id) ?? 0) + 1);
      recvCount.set(r.receiver_id, (recvCount.get(r.receiver_id) ?? 0) + 1);
    }

    const { data: likes } = await svc.from('kudo_like').select('hearts');
    const total_hearts = ((likes ?? []) as { hearts: number }[]).reduce((s, l) => s + l.hearts, 0);

    const allUserIds = [...new Set([...senders, ...receivers])];
    const { data: users } = allUserIds.length > 0
      ? await svc.from('app_user').select('id, full_name, avatar_url, department_id').in('id', allUserIds)
      : { data: [] };
    const { data: depts } = await svc.from('department').select('id, name');
    const deptMap = new Map<string, string>();
    for (const d of (depts ?? []) as { id: string; name: string }[]) deptMap.set(d.id, d.name);
    const userMap = new Map<string, { full_name: string; avatar_url: string | null; department_name: string | null }>();
    for (const u of (users ?? []) as { id: string; full_name: string; avatar_url: string | null; department_id: string | null }[]) {
      userMap.set(u.id, {
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        department_name: u.department_id ? deptMap.get(u.department_id) ?? null : null,
      });
    }

    function topFive(map: Map<string, number>) {
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const u = userMap.get(id);
          return {
            id,
            full_name: u?.full_name ?? 'Unknown',
            avatar_url: u?.avatar_url ?? null,
            department_name: u?.department_name ?? null,
            count,
          };
        });
    }

    return ok({
      total_kudos,
      total_senders: senders.size,
      total_receivers: receivers.size,
      total_hearts,
      top_senders: topFive(sendCount),
      top_receivers: topFive(recvCount),
    }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
