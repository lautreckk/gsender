import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface TenantData {
  name: string;
  logo: string;
  domain: string;
  primaryColor: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  trial_expires_at: string | null;
  coupon_code: string | null;
  subscription_plan: string;
  subscription_status: string;
  is_trial_active: boolean;
}

export const useAuthWithSupabase = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<TenantData | null>(() => {
    const savedTenant = localStorage.getItem('currentTenant');
    return savedTenant ? JSON.parse(savedTenant) : null;
  });
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          trial_expires_at,
          coupon_code,
          subscription_plan,
          subscription_status,
          is_trial_active
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If error is due to missing columns, try basic query and set defaults
        if (error.message?.includes('column') || error.code === 'PGRST116') {
          const { data: basicData, error: basicError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', userId)
            .single();
            
          if (!basicError && basicData) {
            // Set default trial data for new users
            const defaultProfile = {
              ...basicData,
              trial_expires_at: null,
              coupon_code: null,
              subscription_plan: 'trial',
              subscription_status: 'active',
              is_trial_active: false
            };
            setUserProfile(defaultProfile);
            
            // Try to activate default trial
            await activateTrialManually(userId, 'default');
            return;
          }
        }
        return;
      }

      // Set default values for missing fields
      const profileWithDefaults = {
        ...data,
        trial_expires_at: data.trial_expires_at || null,
        coupon_code: data.coupon_code || null,
        subscription_plan: data.subscription_plan || 'trial',
        subscription_status: data.subscription_status || 'active',
        is_trial_active: data.is_trial_active ?? true
      };

      setUserProfile(profileWithDefaults);
      
      // Check if trial is expired
      if (profileWithDefaults.trial_expires_at && new Date(profileWithDefaults.trial_expires_at) < new Date()) {
        await handleTrialExpired(userId);
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const activateTrialManually = async (userId: string, couponCode: string) => {
    try {
      console.log('Activating trial manually for user:', userId, 'with coupon:', couponCode);
      
      // Determine trial days based on coupon
      const trialDays = couponCode === 'gruposena' ? 7 : 1;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + trialDays);
      
      // Update user with trial information
      const { error } = await supabase
        .from('users')
        .update({
          trial_expires_at: expiryDate.toISOString(),
          coupon_code: couponCode,
          subscription_plan: 'trial',
          subscription_status: 'active',
          trial_activated_at: new Date().toISOString(),
          is_trial_active: true
        })
        .eq('id', userId);

      if (error) {
        console.error('Error in manual trial activation:', error);
        throw error;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: `Trial de ${trialDays} dia(s) ativado. Bem-vindo!`,
      });
      
      console.log('Trial activated successfully:', {
        userId,
        couponCode,
        trialDays,
        expiryDate: expiryDate.toISOString()
      });

      // Reload user profile immediately after activation
      await loadUserProfile(userId);
      
    } catch (error) {
      console.error('Error in manual trial activation:', error);
      toast({
        title: "Conta criada",
        description: "Conta criada com sucesso, mas houve um problema com o trial.",
      });
    }
  };

  const handleTrialExpired = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_trial_active: false,
          subscription_status: 'expired'
        })
        .eq('id', userId);

      if (!error) {
        toast({
          title: "Trial expirado",
          description: "Seu período de teste expirou. Faça upgrade para continuar usando.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error handling trial expiry:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Set tenant data (can be customized based on user data)
      const tenantData: TenantData = {
        name: 'Minha Empresa',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=face',
        domain: 'app.minhaempresa.com',
        primaryColor: '#25D366'
      };
      
      localStorage.setItem('currentTenant', JSON.stringify(tenantData));
      setCurrentTenant(tenantData);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (formData: RegisterFormData) => {
    setLoading(true);

    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        toast({
          title: "Erro no cadastro",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Erro no cadastro",
          description: "Não foi possível criar a conta",
          variant: "destructive",
        });
        return;
      }

      // Insert user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't show error to user, as auth user was created successfully
      }

      // Activate trial with coupon - Fallback approach if RPC function doesn't exist
      const couponCode = formData.couponCode.toLowerCase().trim() || 'default';
      
      try {
        const { data: trialResult, error: trialError } = await supabase
          .rpc('activate_user_trial', {
            user_id: authData.user.id,
            coupon_code_input: couponCode
          });

        if (trialError) {
          console.error('Error with RPC function:', trialError);
          // Fallback to manual trial activation
          await activateTrialManually(authData.user.id, couponCode);
        } else {
          const result = trialResult as any;
          if (result.success) {
            toast({
              title: "Conta criada com sucesso!",
              description: `Trial de ${result.trial_days} dia(s) ativado. Bem-vindo!`,
            });
          } else {
            console.error('Trial activation failed:', result.error);
            await activateTrialManually(authData.user.id, couponCode);
          }
        }
      } catch (error) {
        console.error('RPC function not available, using fallback:', error);
        await activateTrialManually(authData.user.id, couponCode);
      }

      // Set tenant data
      const tenantData: TenantData = {
        name: 'Minha Empresa',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=face',
        domain: 'app.minhaempresa.com',
        primaryColor: '#25D366'
      };
      
      localStorage.setItem('currentTenant', JSON.stringify(tenantData));
      setCurrentTenant(tenantData);

      // Reload user profile after trial activation
      setTimeout(() => {
        loadUserProfile(authData.user.id);
      }, 1000);

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }

      // Clear all local storage to prevent data leakage
      localStorage.removeItem('currentTenant');
      localStorage.removeItem('app_settings');
      
      setCurrentTenant(null);
      setLoginForm({ email: '', password: '' });
      setUserProfile(null);
      
      // Force page reload to clear all cached data
      window.location.reload();
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateLoginForm = (field: keyof LoginForm, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const isTrialActive = () => {
    if (!userProfile) return false;
    
    if (!userProfile.is_trial_active) return false;
    
    if (userProfile.trial_expires_at) {
      return new Date(userProfile.trial_expires_at) > new Date();
    }
    
    return false;
  };

  const getTrialDaysRemaining = () => {
    if (!userProfile?.trial_expires_at) return 0;
    
    const expiryDate = new Date(userProfile.trial_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  return {
    // Auth state
    user,
    userProfile,
    session,
    loading,
    isAuthenticated,
    currentTenant,
    
    // Forms
    loginForm,
    
    // Actions
    handleLogin,
    handleRegister,
    handleLogout,
    updateLoginForm,
    
    // Trial info
    isTrialActive: isTrialActive(),
    trialDaysRemaining: getTrialDaysRemaining(),
    
    // Utils
    refreshProfile: () => user ? loadUserProfile(user.id) : null,
  };
};