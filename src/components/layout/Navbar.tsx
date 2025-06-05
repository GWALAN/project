// Navbar.tsx — Updated for Add Product + Profile Customization
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import {
  Menu,
  X,
  Loader2,
  Box,
  User,
  LogOut,
  Settings,
  BarChart
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export function Navbar() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isCreator, setUser, setIsCreator } = useUserStore();
  const { toast } = useToast();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = React.useState(false);

  React.useEffect(() => {
    if (user?.profileImage) {
      setIsLoadingImage(true);
      if (user.profileImage.startsWith('http')) {
        setProfileImageUrl(user.profileImage);
        setIsLoadingImage(false);
        return;
      }
      try {
        const { data } = supabase.storage.from('profile-images').getPublicUrl(user.profileImage);
        if (data?.publicUrl) {
          setProfileImageUrl(data.publicUrl);
        } else {
          setProfileImageUrl(user.profileImage);
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
        setProfileImageUrl(user.profileImage);
      } finally {
        setIsLoadingImage(false);
      }
    } else {
      setProfileImageUrl(null);
    }
  }, [user, supabase]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsCreator(false);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">LinkNest</Link>

        <div className="hidden md:flex items-center space-x-6">
          {session ? (
            <>
              {isCreator && (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition ${isActive('/dashboard') ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/analytics"
                    className={`text-sm font-medium transition ${isActive('/dashboard/analytics') ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                  >
                    <BarChart className="inline-block mr-1 h-4 w-4" />
                    Analytics
                  </Link>
                  <Link
                    to="/dashboard/products/add"
                    className={`text-sm font-medium transition ${isActive('/dashboard/products/add') ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                  >
                    <Box className="inline-block mr-1 h-4 w-4" />
                    Add Product
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className={`text-sm font-medium transition ${isActive('/dashboard/settings') ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                  >
                    <Settings className="inline-block mr-1 h-4 w-4" />
                    Profile Customization
                  </Link>
                </>
              )}
              <div className="flex items-center space-x-4">
                {user && (
                  <Link
                    to={`/u/${user.username}`}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-primary transition"
                  >
                    {isLoadingImage ? (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                      </div>
                    ) : profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover mr-2"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-600 mr-2" />
                    )}
                    My Page
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="inline-block mr-1 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition">Log In</Link>
              <Link to="/register" className="text-sm font-medium text-gray-700 hover:text-primary transition">Sign Up</Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 hover:text-primary focus:outline-none">
            {menuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {session ? (
              <>
                {isCreator && (
                  <>
                    <Link to="/dashboard" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/dashboard/analytics" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Analytics</Link>
                    <Link to="/dashboard/products/add" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Add Product</Link>
                    <Link to="/dashboard/settings" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Profile Customization</Link>
                  </>
                )}
                {user && (
                  <Link to={`/u/${user.username}`} className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>My Page</Link>
                )}
                <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="block text-left text-sm font-medium text-gray-700 hover:text-primary w-full">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/register" className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

