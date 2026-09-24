import React from 'react';
import { LogOut } from 'lucide-react';

// Plain form post, so logout works even before the page has hydrated.
export default function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" className="icon-btn" title="Log out" aria-label="Log out">
        <LogOut size={18} />
      </button>
    </form>
  );
}
