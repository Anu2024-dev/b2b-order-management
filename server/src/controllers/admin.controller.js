import * as reportService from '../services/report.service.js';
import * as auditService from '../services/audit.service.js';
import * as inventoryService from '../services/inventory.service.js';
import { query } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logEvent } from '../services/audit.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getAdminDashboardMetrics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getBusinessReports({ startDate, endDate });
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { action, entityType } = req.query;

    const result = await auditService.listAuditLogs({
      page,
      limit,
      action,
      entityType,
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryMovements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const productId = req.query.productId ? parseInt(req.query.productId, 10) : undefined;

    const result = await inventoryService.listMovements({
      productId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.movements,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustInventory = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await inventoryService.adjustStock({
      ...req.body,
      actorId: req.user.id,
      ipAddress,
    });
    res.status(200).json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const countRes = await query('SELECT COUNT(*) FROM users;');
    const total = parseInt(countRes.rows[0].count, 10);

    const usersRes = await query(
      `SELECT id, name, email, role, company_name, phone, address, is_active, created_at, updated_at
       FROM users
       ORDER BY id ASC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    res.status(200).json({
      success: true,
      data: usersRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { isActive } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (userId === req.user.id) {
      throw new BadRequestError('Administrators cannot alter their own active status');
    }

    const resUser = await query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name, email, role, is_active, updated_at;`,
      [isActive, userId]
    );

    if (resUser.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const updated = resUser.rows[0];

    await logEvent({
      actorId: req.user.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: userId,
      metadata: { targetEmail: updated.email, isActive },
      ipAddress,
    });

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
