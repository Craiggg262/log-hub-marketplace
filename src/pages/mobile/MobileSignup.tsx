import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus, Gift } from 'lucide-react';
import { GlassCard } from '@/components/mobile/GlassCard';
import logoImage from '@/assets/logo.png';

const MobileSignup = () => {
  const [searchParams] = useSearchParams();
  const referralFromUrl = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', fullName: '', phone: '', referralCode: referralFromUrl
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (referralFromUrl && !formData.referralCode) {
      setFormData(prev => ({ ...prev, referralCode: referralFromUrl }));
    }
  }, [referralFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
      if (!formData.phone.trim()) throw new Error('Phone number is required');
      await signUp(formData.email, formData.password, formData.fullName, formData.phone);
      if (formData.referralCode.trim()) {
        localStorage.setItem('pending_referral_code', formData.referralCode.trim().toLowerCase());
      }
      toast({ title: "Account created!", description: "Welcome to Log Hub!" });
      navigate('/app');
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (formData.referralCode.trim()) {
      localStorage.setItem('pending_referral_code', formData.referralCode.trim().toLowerCase());
    }
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({ title: "Google sign-up failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background silk-gradient p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <img src={logoImage} alt="Log Hub" className="h-16 w-16 rounded-2xl mx-auto" />
          <h1 className="text-2xl font-bold text-gradient">Log Hub</h1>
        </div>

        <GlassCard variant="elevated">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Create Account</h2>
            </div>

            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Your full name" value={formData.fullName} onChange={handleInputChange} required className="glass-input h-11 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Your email" value={formData.email} onChange={handleInputChange} required className="glass-input h-11 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create password" value={formData.password} onChange={handleInputChange} required className="glass-input h-11 rounded-xl" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange} required className="glass-input h-11 rounded-xl" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="e.g. 08012345678" value={formData.phone} onChange={handleInputChange} required className="glass-input h-11 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="referralCode" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gift className="h-3 w-3 text-primary" /> Referral Code (Optional)
                </Label>
                <Input id="referralCode" name="referralCode" placeholder="Enter referral code" value={formData.referralCode} onChange={handleInputChange} className={`glass-input h-11 rounded-xl ${referralFromUrl ? 'border-primary' : ''}`} />
                {referralFromUrl && <p className="text-[10px] text-primary">Referral code applied!</p>}
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground">Or</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full h-11 rounded-xl glass-button border-border/30" onClick={handleGoogleSignUp}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/app/login" className="text-primary font-semibold">Sign in</Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MobileSignup;
