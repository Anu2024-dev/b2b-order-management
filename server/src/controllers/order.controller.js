import * as orderService from '../services/order.service.js';

export const createOrder = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await orderService.createOrderFromCart(req.user.id, {
      ...req.body,
      ipAddress,
    });
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const status = req.query.status;

    const result = await orderService.listOrders({
      role: req.user.role,
      userId: req.user.id,
      status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await orderService.getOrderById(orderId, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const orderId = parseInt(req.params.id, 10);
    const updated = await orderService.updateOrderStatus(
      orderId,
      req.body.status,
      req.user.id,
      ipAddress
    );
    res.status(200).json({
      success: true,
      message: `Order status updated to '${req.body.status}'`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
