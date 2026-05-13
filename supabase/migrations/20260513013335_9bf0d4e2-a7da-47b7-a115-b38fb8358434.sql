
-- Add sort_order columns
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 999;
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 999;

-- Update existing categories with sort order and split VPN/Streaming
UPDATE public.categories SET sort_order = 4 WHERE name = 'Facebook';
UPDATE public.categories SET sort_order = 5 WHERE name = 'Instagram';
UPDATE public.categories SET sort_order = 6 WHERE name = 'TikTok';
UPDATE public.categories SET sort_order = 7 WHERE name = 'Twitter';

-- Rename VPN/Streaming -> VPN
UPDATE public.categories SET name = 'VPN', icon = 'shield', color = '#10B981', sort_order = 8 WHERE name = 'VPN/Streaming';

-- Insert new categories (idempotent)
INSERT INTO public.categories (name, icon, color, sort_order) VALUES
  ('Fb Wey Dey Create Page', 'flame', '#EF4444', 1),
  ('Different Countries Facebook', 'globe', '#3B82F6', 2),
  ('Facebook of Different Categories', 'facebook', '#1877F2', 3),
  ('Streaming/Gaming', 'gamepad-2', '#8B5CF6', 9),
  ('Updates and Formats', 'file-text', '#F59E0B', 10),
  ('Reddit and Snapchat', 'message-circle', '#FF4500', 11),
  ('Texting Logs', 'message-square', '#06B6D4', 12),
  ('Working Photos', 'image', '#EC4899', 13),
  ('Mails', 'mail', '#6366F1', 14)
ON CONFLICT DO NOTHING;

-- Reassign logs to proper categories
DO $$
DECLARE
  v_fb_create uuid;
  v_diff_countries uuid;
  v_fb_diff uuid;
  v_vpn uuid;
  v_streaming uuid;
  v_updates uuid;
  v_reddit_snap uuid;
  v_texting uuid;
  v_photos uuid;
  v_mails uuid;
BEGIN
  SELECT id INTO v_fb_create FROM public.categories WHERE name = 'Fb Wey Dey Create Page';
  SELECT id INTO v_diff_countries FROM public.categories WHERE name = 'Different Countries Facebook';
  SELECT id INTO v_fb_diff FROM public.categories WHERE name = 'Facebook of Different Categories';
  SELECT id INTO v_vpn FROM public.categories WHERE name = 'VPN';
  SELECT id INTO v_streaming FROM public.categories WHERE name = 'Streaming/Gaming';
  SELECT id INTO v_updates FROM public.categories WHERE name = 'Updates and Formats';
  SELECT id INTO v_reddit_snap FROM public.categories WHERE name = 'Reddit and Snapchat';
  SELECT id INTO v_texting FROM public.categories WHERE name = 'Texting Logs';
  SELECT id INTO v_photos FROM public.categories WHERE name = 'Working Photos';
  SELECT id INTO v_mails FROM public.categories WHERE name = 'Mails';

  -- Pinned Fb Wey Dey Create Page items
  UPDATE public.logs SET category_id = v_fb_create, sort_order = 1 WHERE id = '917e3ece-f421-4fd0-9382-f20d1ac85255';
  UPDATE public.logs SET category_id = v_fb_create, sort_order = 2 WHERE id = '60f5586b-7b7e-4e3c-8df3-1762074f0149';
  UPDATE public.logs SET category_id = v_fb_create, sort_order = 3 WHERE id = 'a513bfdf-69f5-4df8-8056-91ffd7e2c711';

  -- Different Countries Facebook
  UPDATE public.logs SET category_id = v_diff_countries WHERE id IN (
    '533fb9b6-a5e7-4550-8b8b-8f914339ea3c', -- Canada
    '5e52efdb-e653-40a8-9c9d-400000dd40df', -- China
    '156148a7-b941-4158-b6aa-838ab831b5b0', -- FB 0-20 Friends USA
    '5efc3ccb-3259-4f8e-81a7-128d13346d9e', -- FB 100-200+ Friends Foreign
    'f2f7938e-8902-4d19-bdf4-2a70c471c68a', -- FB Thailand
    '635417d6-3dd1-4583-95f1-dd88c5d2ef2e', -- Foreign Facebook 20+
    '4a791b94-fe9a-4f9e-bf9c-5ea197db2eff', -- Germany
    '2457000a-0a2a-481d-8403-546ef53fe67e', -- India
    '7c40f070-4494-4b42-a0d9-ec1907753cc1', -- Japan
    'acf5ea0c-abfb-4fc5-b951-7325bfaf37e0', -- Random Country
    '63959367-bd9c-4824-93a2-9b0f03058de7', -- Singapore
    '1f83d21a-2224-4b91-9fc0-df7524e7dc2c', -- Switch Profile
    '8720a4b7-f377-4a68-96e7-5f866866c97e', -- Thailand
    '29d3638c-7c85-4b5a-9809-720b6b0a4ad4', -- Ukraine
    'bd50475a-8472-4d90-ae20-8c0ccdba682e', -- USA Facebook
    '64c21f95-400d-4f4f-b2e6-3dea1620c3fd', -- USA Facebook 20-100+
    'd4be93c1-0b2a-44e0-9500-33a94b362856'  -- USA Strong Facebook
  );

  -- Facebook of Different Categories
  UPDATE public.logs SET category_id = v_fb_diff WHERE id IN (
    '3e971ee3-f588-402b-9a4a-3399b5857fdd', -- Facebook Ads Tutorial
    'ce04d979-b04a-47c4-82eb-2d6d98e11a19', -- Marketplace Update
    '64bbbee2-88df-4aa5-b4e4-c14e009ea2c8'  -- Giveaway Facebook
  );

  -- VPN
  UPDATE public.logs SET category_id = v_vpn WHERE id IN (
    '6376a083-ca0b-4606-b6fc-d7b66fb6b69b', -- Express VPN 1-6
    '7efb3e8d-ca2b-4a26-bdca-5c5b2af16736', -- Express VPN 2026-2028
    '89594fba-4020-42fb-b01e-66ff4c9db4b1', -- HMA VPN
    'e95357e6-2221-4b20-8640-edad414dd74e', -- Nord VPN
    'e401f756-e1b6-4936-962e-ce109e6e86e5', -- PIA VPN
    'bb3b1669-a825-42ce-a9c7-ef6121ca3d10', -- Proton VPN
    'f6e1f4f5-5599-4036-9ad2-1134406d7d48'  -- Surfshark VPN
  );

  -- Streaming/Gaming
  UPDATE public.logs SET category_id = v_streaming WHERE id IN (
    'd04d7bd2-716d-4a82-acb6-2142da0b622f', -- Hacked Streaming Platform
    '3e694b46-4ac9-4650-a984-f5a16f4bca56', -- Old Twitch
    'ad833319-1da5-4af2-8963-ab4ff4613145'  -- Roblox
  );

  -- Updates and Formats
  UPDATE public.logs SET category_id = v_updates WHERE id IN (
    'efa4c23a-f51d-4466-a1f2-be3cb886c899', -- 200+ Full Working Formats
    'd8ec4339-b0c5-4436-8279-5ab402447fcb', -- Amira Update
    '1f3bb204-d08e-4ff4-88a6-a92d794d44e2', -- AmjaD Saeed Gold Update
    'b29efd73-34f9-4379-bf07-aaf4ea6c1557', -- Full Elon Musk Format
    'd4219202-5079-40de-a8cc-c40055fffac4', -- Full Truck Update
    'ab25a492-b5ec-42df-b28c-0c629b9d75e1'  -- Phone Voice Call Update
  );

  -- Reddit and Snapchat
  UPDATE public.logs SET category_id = v_reddit_snap WHERE id IN (
    '3ca17b22-b944-4317-bbb8-44d170fbfd7b', -- USA Reddit
    '4f64c6b9-30c8-4c99-9245-0b2a7787d21d'  -- USA Snapchat
  );

  -- Texting Logs
  UPDATE public.logs SET category_id = v_texting WHERE id IN (
    '4618853c-9504-44ce-89e3-60be3c790d46', -- Discord
    'e25cc89e-3bf4-4dad-96ec-a12754dd9f63', -- Old Google Voice
    'ec46f039-b8f2-47c5-b232-48dbbba14c76'  -- Textplus
  );

  -- Working Photos
  UPDATE public.logs SET category_id = v_photos WHERE id IN (
    '3a144a57-1c57-436b-88d0-f6c97e35b1c8'  -- Female Working Pics And Videos
  );

  -- Mails
  UPDATE public.logs SET category_id = v_mails WHERE id IN (
    'c1037d87-fbdd-45c8-b15a-48787675443d', -- Hotmail
    '67fcd225-1937-4f43-8504-7dbf10b9d740'  -- USA Mail Login
  );
END $$;
