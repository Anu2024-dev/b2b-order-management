import * as productService from '../services/product.service.js';

export const list = async (req, res, next) => {
  try {
    const role = req.user ? req.user.role : 'customer';
    const result = await productService.listProducts({
      ...req.query,
      role,
    });
    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const role = req.user ? req.user.role : 'customer';
    const productId = parseInt(req.params.id, 10);
    const product = await productService.getProductById(productId, role);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const product = await productService.createProduct(req.body, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const productId = parseInt(req.params.id, 10);
    const product = await productService.updateProduct(productId, req.body, req.user.id, ipAddress);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const productId = parseInt(req.params.id, 10);
    const product = await productService.toggleProductStatus(
      productId,
      req.body.isActive,
      req.user.id,
      ipAddress
    );
    res.status(200).json({
      success: true,
      message: `Product ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
