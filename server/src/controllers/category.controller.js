import * as categoryService from '../services/category.service.js';

export const list = async (req, res, next) => {
  try {
    const includeInactive = req.user && req.user.role === 'admin' && req.query.includeInactive === 'true';
    const categories = await categoryService.listCategories(includeInactive);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const category = await categoryService.createCategory(req.body, req.user.id, ipAddress);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const categoryId = parseInt(req.params.id, 10);
    const category = await categoryService.updateCategory(categoryId, req.body, req.user.id, ipAddress);
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};
