
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9803bb39-3594-4460-9897-ab017266b62a', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Cantarella - سيدة القلعة الجليدية', 'سيدة القلعة الجليدية', 'تجميد شامل وشلل ترددات الخصم', 'QUEEN',
  'Glacio', 'legendary'::card_rarity, 'تجميد شامل وشلل ترددات الخصم', '/characters/cantarella.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3800,"atk":350,"def":190,"heal":190,"shield":260,"speed":118,"energy":100,"crit_rate":22,"crit_dmg":165,"lifesteal":5,"damage_reduction":9,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_0pq8y2","name":"كسر الموازين الإيقاعي","description":"تجريد دفاع الخصم بنسبة 30% وإلحاق صدمة حرجة مفاجئة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":30,"value_type":"percentage","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_eea9zq","name":"طوفان الشحنات الإضافية","description":"هجوم متسلسل يدعم الضرر المباشر ويرفع مستوى الطاقة","type":"attack","target":"opponent","effect_type":"damage","value":260,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Cantarella - سيدة القلعة الجليدية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '62e789b2-a749-496f-aa6c-04ba1bc8bbd2', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Danjin - هياج النصل القرمزي', 'هياج النصل القرمزي', 'قوة مضاعفة تعتمد على شراسة الهجوم', 'SLAYER',
  'Havoc', 'legendary'::card_rarity, 'قوة مضاعفة تعتمد على شراسة الهجوم', '/characters/danjin.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_cva3u2","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_ww1v4l","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Danjin - هياج النصل القرمزي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '10ff101d-6875-4e25-a7af-ce8156072736', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Encore - مسرح اللهب الخيالي', 'مسرح اللهب الخيالي', 'دمى متفجرة تغمر الحلبة بالنار', 'FANTASY',
  'Fusion', 'legendary'::card_rarity, 'دمى متفجرة تغمر الحلبة بالنار', '/characters/encore.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_bkfcvl","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_u04g4t","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Encore - مسرح اللهب الخيالي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b1bcbd1f-f6b1-4344-93a8-502fce52a6bb', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jianxin - سيدة التناغم والرياح العظمى', 'سيدة التناغم والرياح العظمى', 'درع طاوية يبتلع أقوى الهجمات', 'GRANDMASTER',
  'Aero', 'legendary'::card_rarity, 'درع طاوية يبتلع أقوى الهجمات', '/characters/jianxin.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":4300,"atk":320,"def":225,"heal":0,"shield":420,"speed":104,"energy":100,"crit_rate":15,"crit_dmg":150,"lifesteal":0,"damage_reduction":14,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_30fk0g","name":"حصن النواة المنيع","description":"توليد هالة درعية عظيمة تمتص صدمات المعركة العنيفة","type":"shield","target":"self","effect_type":"shield","value":450,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_8gtrrr","name":"درع الرد التدميري","description":"ردع الهجمات المباشرة مع تخفيض ضرر الخصم بنسبة 25%","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":25,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jianxin - سيدة التناغم والرياح العظمى'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '2f2da6f0-5bc8-4936-841b-b26acc040721', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jinhsi - قاضية جينتشو المتألقة', 'قاضية جينتشو المتألقة', 'حكم الضوء الأبدي ونصل العدالة', 'MAGISTRATE',
  'Spectro', 'legendary'::card_rarity, 'حكم الضوء الأبدي ونصل العدالة', '/characters/jinshi.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_6ipf2y","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_uz0772","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jinhsi - قاضية جينتشو المتألقة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c2a8cbd4-ad7c-4366-b00d-cdd48639a5b0', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jiyan - قائد حراس منتصف الليل', 'قائد حراس منتصف الليل', 'قيادة عسكرية وضربات رمح ثاقبة', 'GENERAL',
  'Aero', 'legendary'::card_rarity, 'قيادة عسكرية وضربات رمح ثاقبة', '/characters/jiyan.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_hw70y5","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_w1trty","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jiyan - قائد حراس منتصف الليل'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6be043c0-3d87-4bef-9f6c-4727271db55e', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Lupa - مفترسة قمر الدمار', 'مفترسة قمر الدمار', 'هجمات وحشية تنهك قوى الخصوم', 'ALPHA',
  'Havoc', 'legendary'::card_rarity, 'هجمات وحشية تنهك قوى الخصوم', '/characters/lupa.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_m53bc0","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_wc00z2","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Lupa - مفترسة قمر الدمار'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '28dfd3aa-f171-43ef-bc50-b9a383bd23f5', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Phoebe - رسولة الأنوار الخالدة', 'رسولة الأنوار الخالدة', 'إنقاذ فائق وحجاب طيفي مانع للهلاك', 'SERAPH',
  'Spectro', 'legendary'::card_rarity, 'إنقاذ فائق وحجاب طيفي مانع للهلاك', '/characters/phoebe.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3900,"atk":330,"def":185,"heal":370,"shield":210,"speed":112,"energy":100,"crit_rate":18,"crit_dmg":155,"lifesteal":7,"damage_reduction":8,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_45tdgw","name":"معجزة الانبعاث الربيعي","description":"شفاء أسطوري مكثف يعيد ملء معظم شريط الصحة","type":"heal","target":"self","effect_type":"heal","value":390,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_el2wum","name":"حجاب القداسة النير","description":"منح درع طيفي وحصانة مؤقتة من الضربات القاتلة","type":"shield","target":"self","effect_type":"shield","value":240,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Phoebe - رسولة الأنوار الخالدة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c943c09f-07f3-4dc1-8b63-7f7df60c2be1', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Phrolova - عازفة ألحان الفناء', 'عازفة ألحان الفناء', 'تفكيك طاقة الخصم وتخفيض دفاعاته', 'VIRTUOSO',
  'Havoc', 'legendary'::card_rarity, 'تفكيك طاقة الخصم وتخفيض دفاعاته', '/characters/phrolova.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3800,"atk":350,"def":190,"heal":190,"shield":260,"speed":118,"energy":100,"crit_rate":22,"crit_dmg":165,"lifesteal":5,"damage_reduction":9,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_443srr","name":"كسر الموازين الإيقاعي","description":"تجريد دفاع الخصم بنسبة 30% وإلحاق صدمة حرجة مفاجئة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":30,"value_type":"percentage","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_4u3lct","name":"طوفان الشحنات الإضافية","description":"هجوم متسلسل يدعم الضرر المباشر ويرفع مستوى الطاقة","type":"attack","target":"opponent","effect_type":"damage","value":260,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Phrolova - عازفة ألحان الفناء'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'fc04ec2b-e0a5-45a6-a236-0c5d1f4d7cde', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Qingxiao - سيف الريح الشاهقة', 'سيف الريح الشاهقة', 'شفرات هوائية تخترق أعتى الدروع', 'SWORDMASTER',
  'Aero', 'legendary'::card_rarity, 'شفرات هوائية تخترق أعتى الدروع', '/characters/qingxiao.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_rlklxg","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_ydkflo","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Qingxiao - سيف الريح الشاهقة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '26103e67-feaf-4aa5-92ab-bc8fbae067d9', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Rover Electro - روفر صحوة الصواعق', 'روفر صحوة الصواعق', 'تناغم ترددات البرق بضربات حاسمة', 'CHOSEN',
  'Electro', 'legendary'::card_rarity, 'تناغم ترددات البرق بضربات حاسمة', '/characters/rover-electro.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_bczoic","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_if8jpc","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Rover Electro - روفر صحوة الصواعق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '4c6e5d33-e7f5-439e-976f-fdc14cd12cb0', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Taoqi - الحصن المنيع المصفح', 'الحصن المنيع المصفح', 'درع صلب يردع أعتى الضربات ويحمي الفريق', 'FORTRESS',
  'Havoc', 'legendary'::card_rarity, 'درع صلب يردع أعتى الضربات ويحمي الفريق', '/characters/taoqi.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":4300,"atk":320,"def":225,"heal":0,"shield":420,"speed":104,"energy":100,"crit_rate":15,"crit_dmg":150,"lifesteal":0,"damage_reduction":14,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_ii117r","name":"حصن النواة المنيع","description":"توليد هالة درعية عظيمة تمتص صدمات المعركة العنيفة","type":"shield","target":"self","effect_type":"shield","value":450,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_8e7w7i","name":"درع الرد التدميري","description":"ردع الهجمات المباشرة مع تخفيض ضرر الخصم بنسبة 25%","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":25,"value_type":"percentage","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Taoqi - الحصن المنيع المصفح'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9b8da9d8-274f-4f6c-aacb-220753b4e6b4', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'The Shorekeeper - حارسة الشاطئ الأزلي', 'حارسة الشاطئ الأزلي', 'تدفق طيفي يرمم قوى الحياة بالكامل', 'STEWARD',
  'Spectro', 'legendary'::card_rarity, 'تدفق طيفي يرمم قوى الحياة بالكامل', '/characters/the shorkepeer.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3900,"atk":330,"def":185,"heal":370,"shield":210,"speed":112,"energy":100,"crit_rate":18,"crit_dmg":155,"lifesteal":7,"damage_reduction":8,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_0hvv38","name":"معجزة الانبعاث الربيعي","description":"شفاء أسطوري مكثف يعيد ملء معظم شريط الصحة","type":"heal","target":"self","effect_type":"heal","value":390,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_34au6t","name":"حجاب القداسة النير","description":"منح درع طيفي وحصانة مؤقتة من الضربات القاتلة","type":"shield","target":"self","effect_type":"shield","value":240,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'The Shorekeeper - حارسة الشاطئ الأزلي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '2c4ee914-0084-48ed-86a3-40b5c2feb1d1', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Verina - حارسة مروج الحياة', 'حارسة مروج الحياة', 'إنعاش ربيعي يمنع السقوط الحاسم', 'FLORIST',
  'Spectro', 'legendary'::card_rarity, 'إنعاش ربيعي يمنع السقوط الحاسم', '/characters/verina.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3900,"atk":330,"def":185,"heal":370,"shield":210,"speed":112,"energy":100,"crit_rate":18,"crit_dmg":155,"lifesteal":7,"damage_reduction":8,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_e435dh","name":"معجزة الانبعاث الربيعي","description":"شفاء أسطوري مكثف يعيد ملء معظم شريط الصحة","type":"heal","target":"self","effect_type":"heal","value":390,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_rtald3","name":"حجاب القداسة النير","description":"منح درع طيفي وحصانة مؤقتة من الضربات القاتلة","type":"shield","target":"self","effect_type":"shield","value":240,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Verina - حارسة مروج الحياة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'e1fd2df1-591e-4bab-9e24-597295888f5e', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Xiangliyao - نابغة التردد الكهرومغناطيسي', 'نابغة التردد الكهرومغناطيسي', 'ذراع آلية متطورة وحسابات دقيقة', 'GENIUS',
  'Electro', 'legendary'::card_rarity, 'ذراع آلية متطورة وحسابات دقيقة', '/characters/xiangliyao.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3800,"atk":350,"def":190,"heal":190,"shield":260,"speed":118,"energy":100,"crit_rate":22,"crit_dmg":165,"lifesteal":5,"damage_reduction":9,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_lw88tl","name":"كسر الموازين الإيقاعي","description":"تجريد دفاع الخصم بنسبة 30% وإلحاق صدمة حرجة مفاجئة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":30,"value_type":"percentage","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_uz54jc","name":"طوفان الشحنات الإضافية","description":"هجوم متسلسل يدعم الضرر المباشر ويرفع مستوى الطاقة","type":"attack","target":"opponent","effect_type":"damage","value":260,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Xiangliyao - نابغة التردد الكهرومغناطيسي'
);