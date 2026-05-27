import { NavLink } from 'react-router-dom'

export default function WikiNavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `wiki-nav-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </NavLink>
  )
}
