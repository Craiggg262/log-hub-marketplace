import { supabase } from '@/integrations/supabase/client';
 import { useQuery } from '@tanstack/react-query';
 import { useAuth } from '@/hooks/useAuth';
 
 export const useReferral = () => {
   const { user } = useAuth();
 
   const { data: referrals = [], isLoading: referralsLoading } = useQuery({
     queryKey: ['referrals', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       const { data, error } = await supabase
         .from('referrals')
         .select('*')
         .eq('referrer_id', user.id)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data || [];
     },
     enabled: !!user?.id,
   });
 
   const { data: earnings = [], isLoading: earningsLoading } = useQuery({
     queryKey: ['referral_earnings', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       const { data, error } = await supabase
         .from('referral_earnings')
         .select('*')
         .eq('referrer_id', user.id)
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data || [];
     },
     enabled: !!user?.id,
   });
 
   return {
     referrals,
     earnings,
     loading: referralsLoading || earningsLoading,
   };
 };

export const processReferralOnSignup = async (referralCode: string, newUserId: string) => {
  if (!referralCode || !newUserId) return;

  try {
    // Find the referrer by referral code
    const { data: referrerProfile, error: findError } = await supabase
      .from('profiles')
      .select('user_id, referral_code')
      .eq('referral_code', referralCode.toLowerCase())
      .maybeSingle();

    if (findError || !referrerProfile) {
      console.log('No referrer found for code:', referralCode);
      return;
    }

    // Don't allow self-referral
    if (referrerProfile.user_id === newUserId) {
      console.log('Self-referral not allowed');
      return;
    }

    // Create the referral record
    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referrerProfile.user_id,
      referred_id: newUserId,
      referral_code: referralCode.toLowerCase(),
    });

    if (insertError) {
      // Ignore duplicate key errors (user already referred)
      if (insertError.code !== '23505') {
        console.error('Error creating referral:', insertError);
      }
    } else {
      console.log('Referral recorded successfully');
    }
  } catch (error) {
    console.error('Error processing referral:', error);
  }
};

export const processReferralEarning = async (
  buyerId: string,
  orderAmount: number,
  orderId?: string,
  universalOrderId?: string
) => {
  try {
    const { error } = await supabase.rpc('process_referral_earning', {
      p_buyer_id: buyerId,
      p_order_amount: orderAmount,
      p_order_id: orderId || null,
      p_universal_order_id: universalOrderId || null,
    });

    if (error) {
      console.error('Error processing referral earning:', error);
    }
  } catch (error) {
    console.error('Error processing referral earning:', error);
  }
};