
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c693cc32-627d-4007-81f9-71c504cd68a7', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Roccia - جلمود الجليد', 'جلمود الجليد', 'حائط صد ثلجي منيع', 'GUARDIAN',
  'Glacio', 'rare'::card_rarity, 'حائط صد ثلجي منيع', '/characters/roccia.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2150,"atk":135,"def":115,"heal":0,"shield":150,"speed":96,"energy":100,"crit_rate":8,"crit_dmg":140,"lifesteal":0,"damage_reduction":6,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_kjk0c6","name":"درع الصد","description":"تفعيل حاجز واقٍ يمتص هجمات الخصم القادمة","type":"shield","target":"self","effect_type":"shield","value":180,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":5}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Roccia - جلمود الجليد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'a3e9651d-1632-4389-9744-1bcf145d923f', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Sigrika - شفرة الظلال', 'شفرة الظلال', 'اغتيال من الهاوية', 'ASSASSIN',
  'Havoc', 'rare'::card_rarity, 'اغتيال من الهاوية', '/characters/sigrika.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_m63tv3","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Sigrika - شفرة الظلال'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'ebee65bb-6e49-4f1e-9d9f-49ef82c238f4', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Suisui - قطرات الندى', 'قطرات الندى', 'تجدد طيفي منعش', 'HEALER',
  'Spectro', 'rare'::card_rarity, 'تجدد طيفي منعش', '/characters/suisui.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1900,"atk":140,"def":90,"heal":160,"shield":50,"speed":100,"energy":100,"crit_rate":10,"crit_dmg":140,"lifesteal":0,"damage_reduction":4,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_mj7upu","name":"ترميم طاقي","description":"استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية","type":"heal","target":"self","effect_type":"heal","value":170,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":6}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Suisui - قطرات الندى'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '10870b6b-37ec-48be-a145-964df2ec8188', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Yangyang - ريشة النسيم', 'ريشة النسيم', 'شحن طاقة واستعادة هدوء', 'SUPPORT',
  'Aero', 'rare'::card_rarity, 'شحن طاقة واستعادة هدوء', '/characters/yangyang.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_iq12zr","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Yangyang - ريشة النسيم'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'aac533c9-f6e5-4089-8dc5-62671a9bf8bd', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Zani - شرارة الوميض', 'شرارة الوميض', 'هجمات نارية متلاحقة', 'SKIRMISHER',
  'Fusion', 'rare'::card_rarity, 'هجمات نارية متلاحقة', '/characters/zani.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_7ev2am","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Zani - شرارة الوميض'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '8d797e5a-330e-4376-90ab-bc7c0c0f86ae', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Brant - مرساة السفينة', 'مرساة السفينة', 'دفاع ناري بحري صلب', 'VANGUARD',
  'Fusion', 'rare'::card_rarity, 'دفاع ناري بحري صلب', '/characters/brant.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2150,"atk":135,"def":115,"heal":0,"shield":150,"speed":96,"energy":100,"crit_rate":8,"crit_dmg":140,"lifesteal":0,"damage_reduction":6,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_lfc0wv","name":"درع الصد","description":"تفعيل حاجز واقٍ يمتص هجمات الخصم القادمة","type":"shield","target":"self","effect_type":"shield","value":180,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":5}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Brant - مرساة السفينة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9803bb39-3594-4460-9897-ab017266b62a', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Cantarella - همس الصقيع', 'همس الصقيع', 'إبطاء وتعطيل الأعداء', 'CONTROLLER',
  'Glacio', 'rare'::card_rarity, 'إبطاء وتعطيل الأعداء', '/characters/cantarella.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1850,"atk":155,"def":95,"heal":80,"shield":100,"speed":105,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":3,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_l1cn34","name":"نبض الإرباك","description":"إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم","type":"debuff","target":"opponent","effect_type":"def_debuff","value":15,"value_type":"percentage","energy_cost":20,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Cantarella - همس الصقيع'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9625b966-b0db-4751-81a5-9063d3cd84b0', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Carlotta - صولجان النور', 'صولجان النور', 'ضربات طيفية براقة', 'STRIKER',
  'Spectro', 'rare'::card_rarity, 'ضربات طيفية براقة', '/characters/carlotta.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1750,"atk":185,"def":80,"heal":0,"shield":0,"speed":108,"energy":100,"crit_rate":14,"crit_dmg":150,"lifesteal":0,"damage_reduction":2,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_vpexmf","name":"ضربة الصدى","description":"هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم","type":"attack","target":"opponent","effect_type":"damage","value":130,"value_type":"flat","energy_cost":20,"cooldown":1,"max_uses":99}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Carlotta - صولجان النور'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '99be4f7d-338e-4b90-8871-9e0b4c4e0157', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Cartethyia - فراشة الأثير', 'فراشة الأثير', 'معالجة رياح خفيفة', 'HEALER',
  'Aero', 'rare'::card_rarity, 'معالجة رياح خفيفة', '/characters/cartethyia.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":1900,"atk":140,"def":90,"heal":160,"shield":50,"speed":100,"energy":100,"crit_rate":10,"crit_dmg":140,"lifesteal":0,"damage_reduction":4,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_i801ac","name":"ترميم طاقي","description":"استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية","type":"heal","target":"self","effect_type":"heal","value":170,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":6}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Cartethyia - فراشة الأثير'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '18f0af0a-47e0-4b87-91c7-d5edab662587', '6359bb27-7a1e-43b7-9ad9-54ee8fafeaab', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Galbrena - حجر الصوان', 'حجر الصوان', 'مقاومة صلبة للضرر', 'TANK',
  'Havoc', 'rare'::card_rarity, 'مقاومة صلبة للضرر', '/characters/galbrena.webp', '{"border_color":"#38bdf8","bg_gradient":"linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)","frame_style":{"border_width":2.5,"border_radius":18,"glow_color":"rgba(56, 189, 248, 0.45)","glow_spread":14,"holo_effect":"subtle_blue"},"text_style":{"title_color":"#f0f9ff","subtitle_color":"#7dd3fc","badge_bg":"rgba(56, 189, 248, 0.3)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2150,"atk":135,"def":115,"heal":0,"shield":150,"speed":96,"energy":100,"crit_rate":8,"crit_dmg":140,"lifesteal":0,"damage_reduction":6,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_x8zh6e","name":"درع الصد","description":"تفعيل حاجز واقٍ يمتص هجمات الخصم القادمة","type":"shield","target":"self","effect_type":"shield","value":180,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":5}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Galbrena - حجر الصوان'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b51777d4-80f0-4ae6-baf5-69c8166694d9', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Aemeath - حارسة الطيف النقي', 'حارسة الطيف النقي', 'توجيه ترددات الضوء الكوني', 'ASTRAL',
  'Spectro', 'epic'::card_rarity, 'توجيه ترددات الضوء الكوني', '/characters/aemeath.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_7zj6d0","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_3nnsm3","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Aemeath - حارسة الطيف النقي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b4af7ad8-f7be-4d59-8451-012db9632639', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Augusta - قاهرة الحشود', 'قاهرة الحشود', 'سيف الدمار الهادر', 'BERSERKER',
  'Havoc', 'epic'::card_rarity, 'سيف الدمار الهادر', '/characters/augusta.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_xsl0vo","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_ox5b22","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Augusta - قاهرة الحشود'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '4e6f0d24-8e45-40ac-bb71-0495bee96efa', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Baizhi - بلورات الهواشيو', 'بلورات الهواشيو', 'بحوث التداوي الصقيعي المتقدم', 'RESEARCHER',
  'Glacio', 'epic'::card_rarity, 'بحوث التداوي الصقيعي المتقدم', '/characters/baizhi.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2850,"atk":220,"def":130,"heal":260,"shield":120,"speed":106,"energy":100,"crit_rate":14,"crit_dmg":145,"lifesteal":4,"damage_reduction":5,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_vo3nfz","name":"فيض الحياة المتجدد","description":"علاج فوري وترميم مستمر لنقاط الصحة","type":"heal","target":"self","effect_type":"heal","value":270,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":5},{"id":"sk_f53s8p","name":"تطهير التردد","description":"إزالة التأثيرات السلبية وتوليد درع وقاية خفيف","type":"shield","target":"self","effect_type":"shield","value":140,"value_type":"flat","energy_cost":20,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Baizhi - بلورات الهواشيو'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '8d797e5a-330e-4376-90ab-bc7c0c0f86ae', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Brant - ربان الشعلة المشتعلة', 'ربان الشعلة المشتعلة', 'مهاجم ناري عالي الضرر', 'CAPTAIN',
  'Fusion', 'epic'::card_rarity, 'مهاجم ناري عالي الضرر', '/characters/brant.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_0o2ub3","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_481f4n","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Brant - ربان الشعلة المشتعلة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '1d6fe0c3-04cb-4275-ac1c-dfbe0d2809f2', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Buling - العاصفة المباغتة', 'العاصفة المباغتة', 'هجمات صاعقة خاطفة', 'STRIKER',
  'Electro', 'epic'::card_rarity, 'هجمات صاعقة خاطفة', '/characters/buling.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_cgv1d6","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_oi794c","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Buling - العاصفة المباغتة'
);