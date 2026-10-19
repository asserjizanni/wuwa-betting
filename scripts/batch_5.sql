
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '3f6f9fd6-cd13-4410-963a-819fcbb347e1', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Yinlin - العازفة على خيوط الرعد', 'العازفة على خيوط الرعد', 'شبكة كهربائية تصعق وتشل حركة الخصم', 'PUPPETEER',
  'Electro', 'legendary'::card_rarity, 'شبكة كهربائية تصعق وتشل حركة الخصم', '/characters/yinlin.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3650,"atk":395,"def":175,"heal":0,"shield":0,"speed":120,"energy":100,"crit_rate":24,"crit_dmg":175,"lifesteal":8,"damage_reduction":5,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_8ezll1","name":"إعصار الهيمنة القاصم","description":"ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم","type":"attack","target":"opponent","effect_type":"damage","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":99},{"id":"sk_tztb8g","name":"غريزة الصيد المفترس","description":"رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة","type":"attack","target":"opponent","effect_type":"damage","value":180,"value_type":"flat","energy_cost":30,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Yinlin - العازفة على خيوط الرعد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '602171e3-4af0-45bb-a2ff-ef41f937cdae', '2af06728-a288-4ec7-b8b7-363953777d0e', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Zhezhi - رسامة الرافعات الجليدية', 'رسامة الرافعات الجليدية', 'لوحات سحرية تستدعي كائنات صقيعية داعمة', 'CALLIGRAPHER',
  'Glacio', 'legendary'::card_rarity, 'لوحات سحرية تستدعي كائنات صقيعية داعمة', '/characters/zhezhi.webp', '{"border_color":"#f59e0b","bg_gradient":"linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)","frame_style":{"border_width":3.5,"border_radius":22,"glow_color":"rgba(245, 158, 11, 0.8)","glow_spread":28,"holo_effect":"golden_rays"},"text_style":{"title_color":"#fffbeb","subtitle_color":"#fcd34d","badge_bg":"rgba(245, 158, 11, 0.4)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 500, 0, true, '{"hp":3800,"atk":350,"def":190,"heal":190,"shield":260,"speed":118,"energy":100,"crit_rate":22,"crit_dmg":165,"lifesteal":5,"damage_reduction":9,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_4uqssd","name":"كسر الموازين الإيقاعي","description":"تجريد دفاع الخصم بنسبة 30% وإلحاق صدمة حرجة مفاجئة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":30,"value_type":"percentage","energy_cost":35,"cooldown":2,"max_uses":4},{"id":"sk_ywzr6q","name":"طوفان الشحنات الإضافية","description":"هجوم متسلسل يدعم الضرر المباشر ويرفع مستوى الطاقة","type":"attack","target":"opponent","effect_type":"damage","value":260,"value_type":"flat","energy_cost":30,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Zhezhi - رسامة الرافعات الجليدية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b51777d4-80f0-4ae6-baf5-69c8166694d9', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Aemeath - سيدة التردد الكوني الأزلي', 'سيدة التردد الكوني الأزلي', 'تجلٍ أسطوري يطوع طيف الفضاء', 'COSMIC SOVEREIGN',
  'Spectro', 'mythic'::card_rarity, 'تجلٍ أسطوري يطوع طيف الفضاء', '/characters/aemeath.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4800,"atk":460,"def":255,"heal":250,"shield":380,"speed":124,"energy":100,"crit_rate":26,"crit_dmg":178,"lifesteal":8,"damage_reduction":11,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_hwn3bu","name":"تفكيك الترددات الخارق","description":"انهيار دفاعات الخصم بنسبة 35% وتوجيه ضربة صاعقة مضاعفة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":35,"value_type":"percentage","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_wk1tw8","name":"مدار الأصداء المتشابك","description":"شحن قتالي واسع يمنح درعاً وهجوماً مرتفعاً في آن واحد","type":"shield","target":"self","effect_type":"shield","value":340,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Aemeath - سيدة التردد الكوني الأزلي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b4af7ad8-f7be-4d59-8451-012db9632639', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Augusta - إمبراطورة دمار القيامة', 'إمبراطورة دمار القيامة', 'طاقة فناء ساحقة تزعزع أركان الحلبة', 'APOCALYPSE',
  'Havoc', 'mythic'::card_rarity, 'طاقة فناء ساحقة تزعزع أركان الحلبة', '/characters/augusta.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_6pl4h6","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_mhf4tk","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Augusta - إمبراطورة دمار القيامة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '6ce2878c-062c-4b1b-88c4-3de756a7d1e9', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Calcharo - صاعقة الفجر الأسود المطلقة', 'صاعقة الفجر الأسود المطلقة', 'شبح البرق المتعالي عن حدود الموت', 'THUNDER GOD',
  'Electro', 'mythic'::card_rarity, 'شبح البرق المتعالي عن حدود الموت', '/characters/calcharo.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_fjs4me","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_tffgmf","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Calcharo - صاعقة الفجر الأسود المطلقة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'cb30771a-9869-4c6b-b32b-656b5447ca1a', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Camellya - كاميليا سرمدية الدماء والظلال', 'كاميليا سرمدية الدماء والظلال', 'فخاخ الهاوية السرمدية والافتراس الكامل', 'BLOOD EMPRESS',
  'Havoc', 'mythic'::card_rarity, 'فخاخ الهاوية السرمدية والافتراس الكامل', '/characters/camellya.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_5687xp","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_myoc8r","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Camellya - كاميليا سرمدية الدماء والظلال'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '57542e8e-ac9a-4d6d-8bf2-a8f3a59b585f', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Changli - عنقاء اللهب السماوي الخالدة', 'عنقاء اللهب السماوي الخالدة', 'احتراق فلكي يعيد إشعال نيران النصر', 'IMMORTAL PHOENIX',
  'Fusion', 'mythic'::card_rarity, 'احتراق فلكي يعيد إشعال نيران النصر', '/characters/changli.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_lqnz9n","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_756148","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Changli - عنقاء اللهب السماوي الخالدة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '62e789b2-a749-496f-aa6c-04ba1bc8bbd2', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Danjin - نصل الجحيم القرمزي الأبدي', 'نصل الجحيم القرمزي الأبدي', 'عاصفة دماء تفجر كل ما يقف في طريقها', 'CRIMSON FIEND',
  'Havoc', 'mythic'::card_rarity, 'عاصفة دماء تفجر كل ما يقف في طريقها', '/characters/danjin.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_5i72md","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_tgjb63","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Danjin - نصل الجحيم القرمزي الأبدي'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '10ff101d-6875-4e25-a7af-ce8156072736', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Encore - حلم الفجر المشتعل الأعظم', 'حلم الفجر المشتعل الأعظم', 'طاقة إشعاع ملتهبة تقلب موازين النزال', 'SOLAR CHILD',
  'Fusion', 'mythic'::card_rarity, 'طاقة إشعاع ملتهبة تقلب موازين النزال', '/characters/encore.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_vhy95t","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_yuih5h","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Encore - حلم الفجر المشتعل الأعظم'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'b1bcbd1f-f6b1-4344-93a8-502fce52a6bb', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jianxin - إلهة التاي تشي والسكينة المطلقة', 'إلهة التاي تشي والسكينة المطلقة', 'درع كوني محكم يمتص أشد الضربات ويردها', 'DIVINE MONK',
  'Aero', 'mythic'::card_rarity, 'درع كوني محكم يمتص أشد الضربات ويردها', '/characters/jianxin.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":5350,"atk":425,"def":285,"heal":0,"shield":550,"speed":110,"energy":100,"crit_rate":18,"crit_dmg":160,"lifesteal":0,"damage_reduction":18,"heal_bonus":0,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_j792ci","name":"قبة الأبدية الفولاذية","description":"درع خرافي عملاق يعزل 550 ضرراً ويمنع السقوط الحاسم","type":"shield","target":"self","effect_type":"shield","value":580,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_7po6c5","name":"ارتداد الزلزال الكوني","description":"عكس نسبة 30% من الأضرار للخصم مع تقليص هجومه","type":"debuff","target":"opponent","effect_type":"atk_debuff","value":30,"value_type":"percentage","energy_cost":35,"cooldown":3,"max_uses":3}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jianxin - إلهة التاي تشي والسكينة المطلقة'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '2f2da6f0-5bc8-4936-841b-b26acc040721', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jinhsi - سيدة تنين الضوء جيوكسيانغ', 'سيدة تنين الضوء جيوكسيانغ', 'سيف النور الإلهي الحاسم لكل صراع', 'DRAGON SOVEREIGN',
  'Spectro', 'mythic'::card_rarity, 'سيف النور الإلهي الحاسم لكل صراع', '/characters/jinshi.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_vtzt06","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_obs8ga","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jinhsi - سيدة تنين الضوء جيوكسيانغ'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c2a8cbd4-ad7c-4366-b00d-cdd48639a5b0', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Jiyan - غضب تنين منتصف الليل الخالد', 'غضب تنين منتصف الليل الخالد', 'زئير الرياح العاتية وهدير النصر العسكري', 'DRAGON GENERAL',
  'Aero', 'mythic'::card_rarity, 'زئير الرياح العاتية وهدير النصر العسكري', '/characters/jiyan.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_ylwa3u","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_l4f9aj","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Jiyan - غضب تنين منتصف الليل الخالد'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'c943c09f-07f3-4dc1-8b63-7f7df60c2be1', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Phrolova - سيمفونية الفوضى الكونية العظمى', 'سيمفونية الفوضى الكونية العظمى', 'صمت تام وترددات تعزل الخصم عن قواه', 'REQUIEM',
  'Havoc', 'mythic'::card_rarity, 'صمت تام وترددات تعزل الخصم عن قواه', '/characters/phrolova.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4800,"atk":460,"def":255,"heal":250,"shield":380,"speed":124,"energy":100,"crit_rate":26,"crit_dmg":178,"lifesteal":8,"damage_reduction":11,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_93hhpy","name":"تفكيك الترددات الخارق","description":"انهيار دفاعات الخصم بنسبة 35% وتوجيه ضربة صاعقة مضاعفة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":35,"value_type":"percentage","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_c3bqmq","name":"مدار الأصداء المتشابك","description":"شحن قتالي واسع يمنح درعاً وهجوماً مرتفعاً في آن واحد","type":"shield","target":"self","effect_type":"shield","value":340,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Phrolova - سيمفونية الفوضى الكونية العظمى'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '9b8da9d8-274f-4f6c-aacb-220753b4e6b4', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'The Shorekeeper - سيدة البحر الأسود ومجرى النجوم', 'سيدة البحر الأسود ومجرى النجوم', 'نبض الحياة الأسمى والإنعاش الإعجازي', 'BLACK SHORE RULER',
  'Spectro', 'mythic'::card_rarity, 'نبض الحياة الأسمى والإنعاش الإعجازي', '/characters/the shorkepeer.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4950,"atk":430,"def":250,"heal":480,"shield":320,"speed":116,"energy":100,"crit_rate":20,"crit_dmg":165,"lifesteal":10,"damage_reduction":10,"heal_bonus":15,"shield_bonus":15,"revive_count":1,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_m90f64","name":"الولادة الجديدة من الرماد","description":"شفاء خرافي فوري يملأ معظم الصحة مع منح نهضة ثانية","type":"heal","target":"self","effect_type":"heal","value":520,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":2},{"id":"sk_lyf91x","name":"هالة الضياء المطلق","description":"درع طيفي يرفع كافة الدفاعات ويقاوم الضربات الحرجة","type":"shield","target":"self","effect_type":"shield","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'The Shorekeeper - سيدة البحر الأسود ومجرى النجوم'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '2c4ee914-0084-48ed-86a3-40b5c2feb1d1', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Verina - شجرة العالم والازدهار السرمدي', 'شجرة العالم والازدهار السرمدي', 'ينبوع حياة متجدد يمنع الهزيمة', 'YGGDRASIL',
  'Spectro', 'mythic'::card_rarity, 'ينبوع حياة متجدد يمنع الهزيمة', '/characters/verina.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4950,"atk":430,"def":250,"heal":480,"shield":320,"speed":116,"energy":100,"crit_rate":20,"crit_dmg":165,"lifesteal":10,"damage_reduction":10,"heal_bonus":15,"shield_bonus":15,"revive_count":1,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_zrbmba","name":"الولادة الجديدة من الرماد","description":"شفاء خرافي فوري يملأ معظم الصحة مع منح نهضة ثانية","type":"heal","target":"self","effect_type":"heal","value":520,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":2},{"id":"sk_pl5t98","name":"هالة الضياء المطلق","description":"درع طيفي يرفع كافة الدفاعات ويقاوم الضربات الحرجة","type":"shield","target":"self","effect_type":"shield","value":360,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Verina - شجرة العالم والازدهار السرمدي'
);