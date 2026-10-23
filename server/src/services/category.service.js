import { query } from '../config/db.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { logEvent } from './audit.service.js';

export const listCategories = async (includeInactive = false) => {
  const sql = includeInactive
    ? 'SELECT id, name, description, is_active, created_at FROM categories ORDER BY name ASC;'
    : 'SELECT id, name, description, is_active, created_at FROM categories WHERE is_active = true ORDER BY name ASC;';

  const res = await query(sql);
  return res.rows;
};

export const createCategory = async ({ name, description }, actorId, ipAddress) => {
  const existing = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1);', [name]);
  if (existing.rows.length > 0) {
    throw new ConflictError('A category with this name already exists');
  }

  const res = await query(
    `INSERT INTO categories (name, description, is_active)
     VALUES ($1, $2, true)
     RETURNING id, name, description, is_active, created_at;`,
    [name, description || null]
  );
  const category = res.rows[0];

  await logEvent({
    actorId,
    action: 'CATEGORY_CREATED',
    entityType: 'CATEGORY',
    entityId: category.id,
    metadata: { name: category.name },
    ipAddress,
  });

  return category;
};

export const updateCategory = async (id, { name, description, isActive }, actorId, ipAddress) => {
  const existing = await query('SELECT id, name, description, is_active FROM categories WHERE id = $1;', [id]);
  if (existing.rows.length === 0) {
    throw new NotFoundError('Category not found');
  }

  const current = existing.rows[0];
  const newName = name !== undefined ? name : current.name;
  const newDesc = description !== undefined ? description : current.description;
  const newActive = isActive !== undefined ? isActive : current.is_active;

  if (name && name.toLowerCase() !== current.name.toLowerCase()) {
    const dupCheck = await query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2;',
      [name, id]
    );
    if (dupCheck.rows.length > 0) {
      throw new ConflictError('Another category already uses this name');
    }
  }

  const res = await query(
    `UPDATE categories
     SET name = $1, description = $2, is_active = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, name, description, is_active, updated_at;`,
    [newName, newDesc, newActive, id]
  );

  const updated = res.rows[0];

  await logEvent({
    actorId,
    action: 'CATEGORY_UPDATED',
    entityType: 'CATEGORY',
    entityId: id,
    metadata: { name: updated.name, isActive: updated.is_active },
    ipAddress,
  });

  return updated;
};

export default {
  listCategories,
  createCategory,
  updateCategory,
};
