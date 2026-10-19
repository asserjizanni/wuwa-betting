
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6ce2878c-062c-4b1b-88c4-3de756a7d1e9', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Calcharo - سيد صائدي الأشباح', 'سيد صائدي الأشباح', 'مرتزق الصواعق القاتلة', 'MERCENARY',
  'Electro', 'epic'::card_rarity, 'مرتزق الصواعق القاتلة', '/characters/calcharo.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_zqb41h","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_pc3f7p","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Calcharo - سيد صائدي الأشباح'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'cb30771a-9869-4c6b-b32b-656b5447ca1a', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Camellya - أشواك الكاميليا القاتلة', 'أشواك الكاميليا القاتلة', 'إزهار الدماء والدمار', 'BLOOM',
  'Havoc', 'epic'::card_rarity, 'إزهار الدماء والدمار', '/characters/camellya.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_yq5x5c","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_g84uvv","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Camellya - أشواك الكاميليا القاتلة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9803bb39-3594-4460-9897-ab017266b62a', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Cantarella - أريا التجدد الجليدي', 'أريا التجدد الجليدي', 'ترميم الجسد بلحن جليدي', 'RESTORER',
  'Glacio', 'epic'::card_rarity, 'ترميم الجسد بلحن جليدي', '/characters/cantarella.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2850,"atk":220,"def":130,"heal":260,"shield":120,"speed":106,"energy":100,"crit_rate":14,"crit_dmg":145,"lifesteal":4,"damage_reduction":5,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_1fux46","name":"فيض الحياة المتجدد","description":"علاج فوري وترميم مستمر لنقاط الصحة","type":"heal","target":"self","effect_type":"heal","value":270,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":5},{"id":"sk_hwqzuq","name":"تطهير التردد","description":"إزالة التأثيرات السلبية وتوليد درع وقاية خفيف","type":"shield","target":"self","effect_type":"shield","value":140,"value_type":"flat","energy_cost":20,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Cantarella - أريا التجدد الجليدي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9625b966-b0db-4751-81a5-9063d3cd84b0', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Carlotta - أميرة الإشعاع الفضي', 'أميرة الإشعاع الفضي', 'تعزيز طاقة وتنسيق حربي', 'TACTICIAN',
  'Spectro', 'epic'::card_rarity, 'تعزيز طاقة وتنسيق حربي', '/characters/carlotta.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_igqo29","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_57aqjr","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Carlotta - أميرة الإشعاع الفضي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '99be4f7d-338e-4b90-8871-9e0b4c4e0157', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Cartethyia - أجنحة العاصفة الهادئة', 'أجنحة العاصفة الهادئة', 'تحكم بمجريات ساحة القتال', 'CONTROLLER',
  'Aero', 'epic'::card_rarity, 'تحكم بمجريات ساحة القتال', '/characters/cartethyia.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_i0op8f","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_i6j167","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Cartethyia - أجنحة العاصفة الهادئة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '57542e8e-ac9a-4d6d-8bf2-a8f3a59b585f', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Changli - مستشارة جينتشو الفذة', 'مستشارة جينتشو الفذة', 'تخطيط استراتيجي وحصار ناري', 'ADVISOR',
  'Fusion', 'epic'::card_rarity, 'تخطيط استراتيجي وحصار ناري', '/characters/changli.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_2ssijm","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_cwynem","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Changli - مستشارة جينتشو الفذة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6dcd4fc2-f861-4ca1-941d-8d177d5d38e8', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Chisa - رصاصة الصفر المطلق', 'رصاصة الصفر المطلق', 'قنص تجميدي خارق', 'SNIPER',
  'Glacio', 'epic'::card_rarity, 'قنص تجميدي خارق', '/characters/chisa.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_flmns2","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_x6jmvi","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Chisa - رصاصة الصفر المطلق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'eaddff0b-dcc6-4611-b7ac-2a5ce49f8e71', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Ciaccona - سيمفونية الريح الطليقة', 'سيمفونية الريح الطليقة', 'عزف ملهم يعزز الحلفاء', 'MINSTREL',
  'Aero', 'epic'::card_rarity, 'عزف ملهم يعزز الحلفاء', '/characters/ciaccona.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_u5iozz","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_w2yyto","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Ciaccona - سيمفونية الريح الطليقة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '62e789b2-a749-496f-aa6c-04ba1bc8bbd2', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Danjin - حد السيف القرمزي', 'حد السيف القرمزي', 'تضحية بالصحة لمضاعفة الهجوم', 'DUALIST',
  'Havoc', 'epic'::card_rarity, 'تضحية بالصحة لمضاعفة الهجوم', '/characters/danjin.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_ed3c45","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_2qfyes","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Danjin - حد السيف القرمزي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '968bbfa8-8997-49e5-a885-146a30af4d74', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Denia - صمام التردد العالي', 'صمام التردد العالي', 'تعطيل محركات الخصم', 'ENGINEER',
  'Electro', 'epic'::card_rarity, 'تعطيل محركات الخصم', '/characters/denia.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_k8cwgh","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_ptr6ol","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Denia - صمام التردد العالي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '10ff101d-6875-4e25-a7af-ce8156072736', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Encore - قصة وولشم المشتعلة', 'قصة وولشم المشتعلة', 'دمى اللهب الانفجارية', 'PUPPETEER',
  'Fusion', 'epic'::card_rarity, 'دمى اللهب الانفجارية', '/characters/encore.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_xlxqke","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_pksd4k","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Encore - قصة وولشم المشتعلة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '18f0af0a-47e0-4b87-91c7-d5edab662587', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Galbrena - قبضة الدمار الزلزالية', 'قبضة الدمار الزلزالية', 'سحق صفوف الخصم بدروع صخرية', 'CRUSHER',
  'Havoc', 'epic'::card_rarity, 'سحق صفوف الخصم بدروع صخرية', '/characters/galbrena.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":3200,"atk":210,"def":165,"heal":0,"shield":280,"speed":99,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":10,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_vq264l","name":"جدار الحصانة المصفح","description":"تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها","type":"shield","target":"self","effect_type":"shield","value":300,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4},{"id":"sk_mjrp6d","name":"تثبيت الصمود","description":"تقليص الضرر المتلقى بنسبة 20% لجولة كاملة","type":"buff","target":"self","effect_type":"damage_reduction","value":20,"value_type":"percentage","energy_cost":25,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Galbrena - قبضة الدمار الزلزالية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '31707fa9-a8c7-449d-9024-48e336f34055', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Hsin - مرآة الحكمة القديمة', 'مرآة الحكمة القديمة', 'كشف نقاط ضعف الخصم', 'SAGE',
  'Spectro', 'epic'::card_rarity, 'كشف نقاط ضعف الخصم', '/characters/hsin.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2750,"atk":240,"def":135,"heal":130,"shield":180,"speed":112,"energy":100,"crit_rate":16,"crit_dmg":152,"lifesteal":0,"damage_reduction":6,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_9jq9n2","name":"شلل التردد الصاعق","description":"إضعاف هجوم الخصم وتعطيل تقدمه السريع","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":20,"value_type":"percentage","energy_cost":25,"cooldown":2,"max_uses":4},{"id":"sk_6oz67a","name":"نبض الدعم التكتيكي","description":"شحن طاقة المعركة وتعزيز الفعالية القتالية","type":"buff","target":"self","effect_type":"damage","value":120,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Hsin - مرآة الحكمة القديمة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '33cdddd6-4e41-4eb4-9d99-bf9f6a821ba9', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Iuno - صقر الأفق البعيد', 'صقر الأفق البعيد', 'انقضاض هوائي جارح', 'STRIKER',
  'Aero', 'epic'::card_rarity, 'انقضاض هوائي جارح', '/characters/iuno.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":2650,"atk":285,"def":115,"heal":0,"shield":0,"speed":114,"energy":100,"crit_rate":19,"crit_dmg":162,"lifesteal":5,"damage_reduction":3,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_al3wph","name":"حد النصل المتفجر","description":"هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم","type":"attack","target":"opponent","effect_type":"damage","value":230,"value_type":"flat","energy_cost":25,"cooldown":2,"max_uses":99},{"id":"sk_4yfqa6","name":"شحنة الحسم","description":"زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة","type":"buff","target":"self","effect_type":"damage","value":15,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Iuno - صقر الأفق البعيد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b1bcbd1f-f6b1-4344-93a8-502fce52a6bb', 'b6b3050e-9bef-4e79-a903-2a4755671062', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jianxin - دائرة الطاوية الدفاعية', 'دائرة الطاوية الدفاعية', 'تحويل قوة ضربات الخصم', 'MONK',
  'Aero', 'epic'::card_rarity, 'تحويل قوة ضربات الخصم', '/characters/jianxin.webp', '{"border_color":"#c084fc","bg_gradient":"linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)","frame_style":{"border_width":3,"border_radius":20,"glow_color":"rgba(192, 132, 252, 0.65)","glow_spread":20,"holo_effect":"purple_pulse"},"text_style":{"title_color":"#faf5ff","subtitle_color":"#d8b4fe","badge_bg":"rgba(168, 85, 247, 0.35)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  false, NULL, 0, true, '{"hp":3200,"atk":210,"def":165,"heal":0,"shield":280,"speed":99,"energy":100,"crit_rate":12,"crit_dmg":145,"lifesteal":0,"damage_reduction":10,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_80b6p0","name":"جدار الحصانة المصفح","description":"تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها","type":"shield","target":"self","effect_type":"shield","value":300,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4},{"id":"sk_xtdn1w","name":"تثبيت الصمود","description":"تقليص الضرر المتلقى بنسبة 20% لجولة كاملة","type":"buff","target":"self","effect_type":"damage_reduction","value":20,"value_type":"percentage","energy_cost":25,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jianxin - دائرة الطاوية الدفاعية'
);