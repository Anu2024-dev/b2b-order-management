import * as cartService from '../services/cart.service.js';

export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCartDetails(req.user.id);
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItemToCart(req.user.id, productId, quantity);
    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user.id, itemId, quantity);
    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const cart = await cartService.removeCartItem(req.user.id, itemId);
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clear = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
