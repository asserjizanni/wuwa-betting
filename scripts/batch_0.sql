
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '1d6fe0c3-04cb-4275-ac1c-dfbe0d2809f2', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Buling - صاعقة الميدان', 'صاعقة الميدان', 'مقاتلة كهربائية طليعية', 'STRIKER',
  'Electro', 'rare'::card_rarity, 'مقاتلة كهربائية طليعية', '/characters/buling.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_xbqci4","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Buling - صاعقة الميدان'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6dcd4fc2-f861-4ca1-941d-8d177d5d38e8', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Chisa - قناصة الجليد', 'قناصة الجليد', 'دعم تكتيكي ومراقبة', 'SCOUT',
  'Glacio', 'rare'::card_rarity, 'دعم تكتيكي ومراقبة', '/characters/chisa.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_5eggmi","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Chisa - قناصة الجليد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '968bbfa8-8997-49e5-a885-146a30af4d74', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Denia - شحنة التماس', 'شحنة التماس', 'هجوم صاعق سريع', 'SKIRMISHER',
  'Electro', 'rare'::card_rarity, 'هجوم صاعق سريع', '/characters/denia.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_cxzgv0","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Denia - شحنة التماس'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '109d4044-af0d-4964-8912-abb83e20072c', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Hiyuki - درع الشتاء', 'درع الشتاء', 'مدافعة صلبة كالصخر', 'DEFENDER',
  'Glacio', 'rare'::card_rarity, 'مدافعة صلبة كالصخر', '/characters/hiyuki.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2150,"atk":135,"def":115,"heal":0,"shield":150,"speed":96,"energy":100,"crit_rate":8,"crit_dmg":140,"lifesteal":0,"damage_reduction":6,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_u8qtdu","name":"درع الصد","description":"تفعيل حاجز واقٍ يمتص هجمات الخصم القادمة","type":"shield","target":"self","effect_type":"shield","value":180,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":5}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Hiyuki - درع الشتاء'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '31707fa9-a8c7-449d-9024-48e336f34055', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Hsin - ضوء السكينة', 'ضوء السكينة', 'مداوية أطياف هادئة', 'HEALER',
  'Spectro', 'rare'::card_rarity, 'مداوية أطياف هادئة', '/characters/hsin.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1900,"atk":140,"def":90,"heal":160,"shield":50,"speed":100,"energy":100,"crit_rate":10,"crit_dmg":140,"lifesteal":0,"damage_reduction":4,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_d04hn0","name":"ترميم طاقي","description":"استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية","type":"heal","target":"self","effect_type":"heal","value":170,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":6}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Hsin - ضوء السكينة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '33cdddd6-4e41-4eb4-9d99-bf9f6a821ba9', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Iuno - نسيم الرصد', 'نسيم الرصد', 'ملاحة الرياح والاستكشاف', 'NAVIGATOR',
  'Aero', 'rare'::card_rarity, 'ملاحة الرياح والاستكشاف', '/characters/iuno.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_2b25j5","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Iuno - نسيم الرصد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'fde0b657-cf06-406f-ac05-a2c3fced705a', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lingyang - قفزة الأسد الجليدي', 'قفزة الأسد الجليدي', 'مهاجم جليدي رشيق', 'DUALIST',
  'Glacio', 'rare'::card_rarity, 'مهاجم جليدي رشيق', '/characters/lingyang.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_24chun","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lingyang - قفزة الأسد الجليدي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'ab11334a-50ea-4a7a-9a18-b1e9ad014bb7', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lucy - إيقاع الشرار', 'إيقاع الشرار', 'إرباك كهربائي ودعم', 'DISRUPTOR',
  'Electro', 'rare'::card_rarity, 'إرباك كهربائي ودعم', '/characters/lucy.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_yyu7nu","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lucy - إيقاع الشرار'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9e9b77f4-37c7-4f2f-820c-9c8c6c136865', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Luuk - عاصفة السهول', 'عاصفة السهول', 'مهاجم هوائي مباغت', 'STRIKER',
  'Aero', 'rare'::card_rarity, 'مهاجم هوائي مباغت', '/characters/luuk.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_s4avqy","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Luuk - عاصفة السهول'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '19ad9c10-649c-4a88-a574-039e59c78905', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lynae - بلسم الصقيع', 'بلسم الصقيع', 'ترميم الجراح الباردة', 'HEALER',
  'Glacio', 'rare'::card_rarity, 'ترميم الجراح الباردة', '/characters/lynae.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1900,"atk":140,"def":90,"heal":160,"shield":50,"speed":100,"energy":100,"crit_rate":10,"crit_dmg":140,"lifesteal":0,"damage_reduction":4,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_kaxgyh","name":"ترميم طاقي","description":"استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية","type":"heal","target":"self","effect_type":"heal","value":170,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":6}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lynae - بلسم الصقيع'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'ce34e89a-aee0-4cd9-bd6c-1db60fa3ca95', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Mornye - لهب المداخن', 'لهب المداخن', 'هجوم ناري مشتعل', 'PYRO',
  'Fusion', 'rare'::card_rarity, 'هجوم ناري مشتعل', '/characters/mornye.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_lyqy7v","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Mornye - لهب المداخن'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '28dfd3aa-f171-43ef-bc50-b9a383bd23f5', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Phoebe - ترتيلة الشفاء', 'ترتيلة الشفاء', 'كاهنة الضياء الطيفي', 'PRIESTESS',
  'Spectro', 'rare'::card_rarity, 'كاهنة الضياء الطيفي', '/characters/phoebe.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1900,"atk":140,"def":90,"heal":160,"shield":50,"speed":100,"energy":100,"crit_rate":10,"crit_dmg":140,"lifesteal":0,"damage_reduction":4,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_hf915w","name":"ترميم طاقي","description":"استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية","type":"heal","target":"self","effect_type":"heal","value":170,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":6}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Phoebe - ترتيلة الشفاء'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'fc04ec2b-e0a5-45a6-a236-0c5d1f4d7cde', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Qingxiao - سيف الخيزران', 'سيف الخيزران', 'انسيابية وسرعة مناورة', 'BLADE',
  'Aero', 'rare'::card_rarity, 'انسيابية وسرعة مناورة', '/characters/qingxiao.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_oqv399","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Qingxiao - سيف الخيزران'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'a2876b25-83aa-42de-a3b7-b3495fb1d12f', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Qiuyuan - انعكاس البريق', 'انعكاس البريق', 'مرآة الضوء المضلل', 'TACTICIAN',
  'Spectro', 'rare'::card_rarity, 'مرآة الضوء المضلل', '/characters/qiuyuan.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_5ofxu4","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Qiuyuan - انعكاس البريق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'e769a4e2-6535-4a69-b3b4-4c83852a977f', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Rebecca - محرك الصعق', 'محرك الصعق', 'تقنية كهربائية هجومية', 'STRIKER',
  'Electro', 'rare'::card_rarity, 'تقنية كهربائية هجومية', '/characters/rebecca.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_6xtb3p","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Rebecca - محرك الصعق'
);