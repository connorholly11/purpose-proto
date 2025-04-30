import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavBar.module.css';

export interface NavItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

interface NavBarProps {
  items: NavItem[];
  isAdminMode?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ 
  items, 
  isAdminMode = false
}) => {
  const pathname = usePathname();

  // Filter items based on admin mode
  const filteredItems = items.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdminMode)
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {filteredItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Link 
              href={item.path} 
              key={item.name}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <div className={styles.navItem}>
                <span className={styles.navIcon}>
                  {/* We're just showing the icon name as text here */}
                  {/* In a real implementation, you would use an icon component */}
                  {item.icon === 'chat-bubble' ? '💬' : 
                    item.icon === 'emoji-events' ? '🏆' : 
                    item.icon === 'person' ? '👤' : 
                    item.icon === 'dashboard' ? '📊' : 
                    item.icon === 'settings' ? '⚙️' : 
                    item.icon === 'admin-panel-settings' ? '🔧' : 
                    item.icon === 'science' ? '🧪' : 
                    item.icon === 'score' ? '📝' : 
                    item.icon}
                </span>
                <span className={styles.navLabel}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;