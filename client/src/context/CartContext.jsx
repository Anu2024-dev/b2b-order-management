import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isCustomer } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isCustomer) return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data.data);
    } catch {
      // Ignore initial cart errors
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (user && isCustomer) {
      fetchCart();
    } else {
      setCart({ items: [], itemCount: 0, subtotal: 0, taxAmount: 0, totalAmount: 0 });
    }
  }, [user, isCustomer, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    setCart(res.data.data);
    return res.data.data;
  };

  const updateQuantity = async (itemId, quantity) => {
    const res = await api.patch(`/cart/items/${itemId}`, { quantity });
    setCart(res.data.data);
    return res.data.data;
  };

  const removeFromCart = async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    setCart(res.data.data);
    return res.data.data;
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart({ items: [], itemCount: 0, subtotal: 0, taxAmount: 0, totalAmount: 0 });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount: cart.itemCount || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
