import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  token_points: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  updatePoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Check if we have saved profile data in localStorage
      const savedProfile = localStorage.getItem(`user_profile_${userId}`);
      
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setLoading(false);
        console.log('Loaded saved user profile:', parsedProfile);
        return;
      }

      // Create new profile from auth data
      const { data: userData } = await supabase.auth.getUser();
      const profile: UserProfile = {
        id: userId,
        email: userData.user?.email || '',
        token_points: 1000,
        created_at: new Date().toISOString(),
      };
      
      // Save to localStorage
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(profile));
      setProfile(profile);
      setLoading(false);
      console.log('Created and saved new user profile:', profile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Ensure we always have a profile
      const fallbackProfile: UserProfile = {
        id: userId,
        email: '',
        token_points: 1000,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(fallbackProfile));
      setProfile(fallbackProfile);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        
        // Handle email confirmation success
        if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
          console.log('User confirmed and signed in, redirecting to dashboard');
          // The redirect will happen automatically since the user state changes
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      console.log('Creating profile for user:', userId, userData.user?.email);
      
      // Create profile immediately without database dependency
      const newProfile: UserProfile = {
        id: userId,
        email: userData.user?.email || '',
        token_points: 1000,
        created_at: new Date().toISOString(),
      };
      
      // Save to localStorage
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(newProfile));
      setProfile(newProfile);
      console.log('Created and saved user profile:', newProfile);

    } catch (error) {
      console.error('Error in createUserProfile:', error);
      // Ensure profile is always created
      const fallbackProfile: UserProfile = {
        id: userId,
        email: '',
        token_points: 1000,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(fallbackProfile));
      setProfile(fallbackProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (response.error) throw response.error;
    
    // Check if email confirmation is required
    if (response.data.user && !response.data.user.email_confirmed_at) {
      throw new Error('Please check your email and click the confirmation link before signing in.');
    }
    
    return response;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePoints = (newPoints: number) => {
    if (profile) {
      const updatedProfile = { ...profile, token_points: newPoints };
      setProfile(updatedProfile);
      // Save updated points to localStorage
      localStorage.setItem(`user_profile_${profile.id}`, JSON.stringify(updatedProfile));
      console.log('Updated and saved points:', newPoints);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updatePoints,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
