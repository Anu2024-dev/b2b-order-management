import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Package,
  ShoppingCart,
  Layers,
  FileText,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  BarChart3,
  Boxes,
  ClipboardList,
  Users,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar" aria-label="Main Navigation">
        <div className="nav-container">
          <Link to={isAdmin ? '/admin/dashboard' : '/catalog'} className="nav-brand">
            <Layers size={26} color="#60a5fa" />
            <span>ARROWSTACK</span> B2B
          </Link>

          <ul className="nav-menu">
            {/* Catalog: accessible to all */}
            <li>
              <NavLink to="/catalog" className="nav-link">
                <Package size={18} /> Products
              </NavLink>
            </li>

            {/* Customer Specific Menus */}
            {isAuthenticated && isCustomer && (
              <>
                <li>
                  <NavLink to="/cart" className="nav-link">
                    <ShoppingCart size={18} /> Cart
                    {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/orders" className="nav-link">
                    <ClipboardList size={18} /> My Orders
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile" className="nav-link">
                    <User size={18} /> Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* Admin Quick Console Link in Main Bar */}
            {isAuthenticated && isAdmin && (
              <li>
                <NavLink to="/admin/dashboard" className="nav-link" style={{ fontWeight: 600, color: '#93c5fd' }}>
                  <BarChart3 size={18} /> Operations Console
                </NavLink>
              </li>
            )}

            {/* Auth State Control */}
            {isAuthenticated ? (
              <>
                <li>
                  <span className="user-badge" title={`Signed in as ${user?.name} (${user?.role})`}>
                    <User size={14} />
                    <span>{user?.name}</span>
                    <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({user?.role})</span>
                  </span>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="btn-logout"
                    data-testid="logout-btn"
                    title="Sign out of your session"
                    type="button"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login" className="nav-link">
                    <LogIn size={18} /> Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className="btn btn-sm btn-primary">
                    <UserPlus size={16} /> Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {/* Admin Secondary Ribbon Bar: Dedicated and accessible without cluttering */}
      {isAuthenticated && isAdmin && (
        <div className="admin-ribbon" role="region" aria-label="Administrator Submenu">
          <div className="admin-ribbon-container">
            <span className="admin-ribbon-tag">
              <ShieldCheck size={13} /> Admin Controls
            </span>
            <ul className="admin-ribbon-links">
              <li>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <BarChart3 size={15} /> Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <Package size={15} /> Inventory Items
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/categories"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <Layers size={15} /> Categories
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/inventory"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <Boxes size={15} /> Stock Logs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <ClipboardList size={15} /> All Orders
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <Users size={15} /> Users
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/audit-logs"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <ShieldCheck size={15} /> Audit Logs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) => `admin-ribbon-link ${isActive ? 'active' : ''}`}
                >
                  <FileText size={15} /> Reports
                </NavLink>
              </li>
            </ul>
            <button
              onClick={handleLogout}
              className="admin-ribbon-link"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#f87171',
                padding: '0.3rem 0.6rem',
              }}
              title="Sign out of administrative session"
              type="button"
            >
              <LogOut size={14} /> Exit Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
