import { query } from '../config/db.js';

export const logEvent = async ({
  actorId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
  ipAddress = null,
  client = null,
}) => {
  try {
    const sql = `
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const params = [
      actorId,
      action,
      entityType,
      entityId ? entityId.toString() : null,
      metadata ? JSON.stringify(metadata) : null,
      ipAddress,
    ];

    if (client) {
      await client.query(sql, params);
    } else {
      await query(sql, params);
    }
  } catch (err) {
    // Audit log failures must be reported but shouldn't silently swallow
    console.error('[AUDIT LOG ERROR]:', err.message);
  }
};

export const listAuditLogs = async ({ page = 1, limit = 20, entityType, action }) => {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  if (entityType) {
    params.push(entityType);
    whereClauses.push(`a.entity_type = $${params.length}`);
  }

  if (action) {
    params.push(action);
    whereClauses.push(`a.action = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*) FROM audit_logs a ${whereSql};`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const sql = `
    SELECT 
      a.id, 
      a.actor_id, 
      u.name as actor_name, 
      u.email as actor_email, 
      u.role as actor_role,
      a.action, 
      a.entity_type, 
      a.entity_id, 
      a.metadata, 
      a.ip_address, 
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_id = u.id
    ${whereSql}
    ORDER BY a.created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  const logsRes = await query(sql, params);

  return {
    logs: logsRes.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  logEvent,
  listAuditLogs,
};
