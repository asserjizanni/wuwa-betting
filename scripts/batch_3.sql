
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '23823db3-7a85-4b46-a8c1-3e47d70fa970', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jingran - سيف الجمر المتأجج', 'سيف الجمر المتأجج', 'لهيب متواصل يحرق الدروع', 'BLADE',
  'Fusion', 'epic'::card_rarity, 'لهيب متواصل يحرق الدروع', '/characters/jingran.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_suwv4n","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_8dst5l","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jingran - سيف الجمر المتأجج'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'fde0b657-cf06-406f-ac05-a2c3fced705a', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lingyang - مهرجان الوثبة الجليدية', 'مهرجان الوثبة الجليدية', 'هجمات بهلوانية قوية', 'FIGHTER',
  'Glacio', 'epic'::card_rarity, 'هجمات بهلوانية قوية', '/characters/lingyang.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_g8p2dd","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_srfk82","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lingyang - مهرجان الوثبة الجليدية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '4c7b566f-2dfe-4674-adbd-14c46d16c09f', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lucilla - نبع الفجر المنبثق', 'نبع الفجر المنبثق', 'علاج متدفق وحماية طيفية', 'HEALER',
  'Spectro', 'epic'::card_rarity, 'علاج متدفق وحماية طيفية', '/characters/lucilla.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2850,"atk":220,"def":130,"heal":260,"shield":120,"speed":106,"energy":100,"crit_rate":14,"crit_dmg":145,"lifesteal":4,"damage_reduction":5,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_goerzs","name":"فيض الحياة المتجدد","description":"علاج فوري وترميم مستمر لنقاط الصحة","type":"heal","target":"self","effect_type":"heal","value":270,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":5},{"id":"sk_imdz69","name":"تطهير التردد","description":"إزالة التأثيرات السلبية وتوليد درع وقاية خفيف","type":"shield","target":"self","effect_type":"shield","value":140,"value_type":"flat","energy_cost":20,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lucilla - نبع الفجر المنبثق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'ab11334a-50ea-4a7a-9a18-b1e9ad014bb7', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lucy - تيار البرق المتردد', 'تيار البرق المتردد', 'ضربات متتابعة تكسر الحصون', 'STRIKER',
  'Electro', 'epic'::card_rarity, 'ضربات متتابعة تكسر الحصون', '/characters/lucy.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_t5meb6","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_3hq7n9","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lucy - تيار البرق المتردد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6be043c0-3d87-4bef-9f6c-4727271db55e', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lupa - ذئبة الصيد المظلمة', 'ذئبة الصيد المظلمة', 'تمزيق خطوط الخصم المفتوحة', 'HUNTER',
  'Havoc', 'epic'::card_rarity, 'تمزيق خطوط الخصم المفتوحة', '/characters/lupa.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_1s10rh","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_hki3tu","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lupa - ذئبة الصيد المظلمة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'ce34e89a-aee0-4cd9-bd6c-1db60fa3ca95', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Mornye - درع الحمم البركانية', 'درع الحمم البركانية', 'امتصاص النيران وردها صهيراً', 'JUGGERNAUT',
  'Fusion', 'epic'::card_rarity, 'امتصاص النيران وردها صهيراً', '/characters/mornye.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":3200,"atk":210,"def":165,"heal":0,"shield":280,"speed":99,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":10,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_o2i2rf","name":"جدار الحصانة المصفح","description":"تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها","type":"shield","target":"self","effect_type":"shield","value":300,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4},{"id":"sk_5bd0ph","name":"تثبيت الصمود","description":"تقليص الضرر المتلقى بنسبة 20% لجولة كاملة","type":"buff","target":"self","effect_type":"damage_reduction","value":20,"value_type":"percentage","energy_cost":25,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Mornye - درع الحمم البركانية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c943c09f-07f3-4dc1-8b63-7f7df60c2be1', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Phrolova - أوتار اللحن الكئيب', 'أوتار اللحن الكئيب', 'إضعاف دمار شامل للمنافس', 'MAESTRO',
  'Havoc', 'epic'::card_rarity, 'إضعاف دمار شامل للمنافس', '/characters/phrolova.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_zecl8t","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_r467it","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Phrolova - أوتار اللحن الكئيب'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c693cc32-627d-4007-81f9-71c504cd68a7', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Roccia - متراس الثلج الأبدي', 'متراس الثلج الأبدي', 'حصانة عالية ضد الصدمات', 'BASTION',
  'Glacio', 'epic'::card_rarity, 'حصانة عالية ضد الصدمات', '/characters/roccia.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":3200,"atk":210,"def":165,"heal":0,"shield":280,"speed":99,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":10,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_t3lahh","name":"جدار الحصانة المصفح","description":"تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها","type":"shield","target":"self","effect_type":"shield","value":300,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4},{"id":"sk_qnqf7l","name":"تثبيت الصمود","description":"تقليص الضرر المتلقى بنسبة 20% لجولة كاملة","type":"buff","target":"self","effect_type":"damage_reduction","value":20,"value_type":"percentage","energy_cost":25,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Roccia - متراس الثلج الأبدي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '26103e67-feaf-4aa5-92ab-bc8fbae067d9', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Rover Electro - صدى الصواعق المتجددة', 'صدى الصواعق المتجددة', 'هجوم متزن ومتكيف مع الميدان', 'RESONATOR',
  'Electro', 'epic'::card_rarity, 'هجوم متزن ومتكيف مع الميدان', '/characters/rover-electro.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_dmk6a4","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_w18byk","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Rover Electro - صدى الصواعق المتجددة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '4c6e5d33-e7f5-439e-976f-fdc14cd12cb0', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Taoqi - سيف الحصانة الثقيل', 'سيف الحصانة الثقيل', 'دفاع حديدي وتأمين الحلفاء', 'GUARDIAN',
  'Havoc', 'epic'::card_rarity, 'دفاع حديدي وتأمين الحلفاء', '/characters/taoqi.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":3200,"atk":210,"def":165,"heal":0,"shield":280,"speed":99,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":10,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_6yg20u","name":"جدار الحصانة المصفح","description":"تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها","type":"shield","target":"self","effect_type":"shield","value":300,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4},{"id":"sk_zn6oi7","name":"تثبيت الصمود","description":"تقليص الضرر المتلقى بنسبة 20% لجولة كاملة","type":"buff","target":"self","effect_type":"damage_reduction","value":20,"value_type":"percentage","energy_cost":25,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Taoqi - سيف الحصانة الثقيل'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b4af7ad8-f7be-4d59-8451-012db9632639', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Augusta - أميرة الهاوية الدامية', 'أميرة الهاوية الدامية', 'سحق كامل لا يعرف التراجع', 'SOVEREIGN',
  'Havoc', 'legendary'::card_rarity, 'سحق كامل لا يعرف التراجع', '/characters/augusta.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_j4i8gn","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_vwnrci","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Augusta - أميرة الهاوية الدامية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '4e6f0d24-8e45-40ac-bb71-0495bee96efa', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Baizhi - التردد الصقيعي المطلق', 'التردد الصقيعي المطلق', 'درع جليدي متقدم وشفاء فوري', 'ARCH-SCHOLAR',
  'Glacio', 'legendary'::card_rarity, 'درع جليدي متقدم وشفاء فوري', '/characters/baizhi.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3900,"atk":330,"def":185,"heal":370,"shield":210,"speed":112,"energy":100,"crit_rate":18,"crit_dmg":155,"lifesteal":7,"damage_reduction":8,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_yz9qmj","name":"معجزة الانبعاث الربيعي","description":"شفاء أسطوري مكثف يعيد ملء معظم شريط الصحة","type":"heal","target":"self","effect_type":"heal","value":390,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_gyxpas","name":"حجاب القداسة النير","description":"منح درع طيفي وحصانة مؤقتة من الضربات القاتلة","type":"shield","target":"self","effect_type":"shield","value":240,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Baizhi - التردد الصقيعي المطلق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '8d797e5a-330e-4376-90ab-bc7c0c0f86ae', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Brant - قبطان الأسطول المشتعل', 'قبطان الأسطول المشتعل', 'مدافع نارية تصهر دفاعات الخصم', 'ADMIRAL',
  'Fusion', 'legendary'::card_rarity, 'مدافع نارية تصهر دفاعات الخصم', '/characters/brant.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_i8eqw6","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_flvb0p","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Brant - قبطان الأسطول المشتعل'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6ce2878c-062c-4b1b-88c4-3de756a7d1e9', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Calcharo - شبح الظلال الرعدي', 'شبح الظلال الرعدي', 'سيف البرق الهائج وسرعة خارقة', 'SHADOW',
  'Electro', 'legendary'::card_rarity, 'سيف البرق الهائج وسرعة خارقة', '/characters/calcharo.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_be5p36","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_niyj56","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Calcharo - شبح الظلال الرعدي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'cb30771a-9869-4c6b-b32b-656b5447ca1a', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Camellya - كاميليا النشوة القرمزية', 'كاميليا النشوة القرمزية', 'حبال الدمار الخانقة والضربات القاتلة', 'HARVESTER',
  'Havoc', 'legendary'::card_rarity, 'حبال الدمار الخانقة والضربات القاتلة', '/characters/camellya.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_u4a9r7","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_dzds0t","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Camellya - كاميليا النشوة القرمزية'
);