
INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  'e1fd2df1-591e-4bab-9e24-597295888f5e', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Xiangliyao - عقل التردد الكمي الفائق', 'عقل التردد الكمي الفائق', 'تلاعب بحقول الطاقة وسحق كهرومغناطيسي', 'QUANTUM ARCHITECT',
  'Electro', 'mythic'::card_rarity, 'تلاعب بحقول الطاقة وسحق كهرومغناطيسي', '/characters/xiangliyao.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4800,"atk":460,"def":255,"heal":250,"shield":380,"speed":124,"energy":100,"crit_rate":26,"crit_dmg":178,"lifesteal":8,"damage_reduction":11,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_fw2hge","name":"تفكيك الترددات الخارق","description":"انهيار دفاعات الخصم بنسبة 35% وتوجيه ضربة صاعقة مضاعفة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":35,"value_type":"percentage","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_v1sjj0","name":"مدار الأصداء المتشابك","description":"شحن قتالي واسع يمنح درعاً وهجوماً مرتفعاً في آن واحد","type":"shield","target":"self","effect_type":"shield","value":340,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Xiangliyao - عقل التردد الكمي الفائق'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '3f6f9fd6-cd13-4410-963a-819fcbb347e1', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Yinlin - سيدة شبكة الصواعق الإمبراطورية', 'سيدة شبكة الصواعق الإمبراطورية', 'أسر كهربائي لا مفر منه ودمى فتاكة', 'LIGHTNING EMPRESS',
  'Electro', 'mythic'::card_rarity, 'أسر كهربائي لا مفر منه ودمى فتاكة', '/characters/yinlin.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4650,"atk":495,"def":240,"heal":0,"shield":0,"speed":126,"energy":100,"crit_rate":29,"crit_dmg":188,"lifesteal":12,"damage_reduction":7,"heal_bonus":0,"shield_bonus":0,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_ah3keb","name":"انفجار التردد السرمدي","description":"إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد","type":"attack","target":"opponent","effect_type":"damage","value":490,"value_type":"flat","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_q02lbh","name":"رقصة النجوم الممزقة","description":"هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم","type":"attack","target":"opponent","effect_type":"damage","value":320,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Yinlin - سيدة شبكة الصواعق الإمبراطورية'
);

INSERT INTO public.cards (
  character_id, template_id, set_id, name, title, subtitle, decorative_text,
  element, rarity, description, image_path, card_design_override,
  is_limited, max_supply, current_supply, is_published, stats, skills
)
SELECT
  '602171e3-4af0-45bb-a2ff-ef41f937cdae', '097a12be-56b7-4d88-86d1-77d34bcaffdc', 'b4734a81-46a8-4fa3-bc49-f2fc119ccd26', 'Zhezhi - ريشة الخلود والثلج الأزلي', 'ريشة الخلود والثلج الأزلي', 'تجسيد أسطوري يحيط الحلبة بجليد أبدي', 'CELESTIAL SCRIBE',
  'Glacio', 'mythic'::card_rarity, 'تجسيد أسطوري يحيط الحلبة بجليد أبدي', '/characters/zhezhi.webp', '{"border_color":"#ec4899","bg_gradient":"linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)","frame_style":{"border_width":4,"border_radius":24,"glow_color":"rgba(236, 72, 153, 0.95)","glow_spread":35,"holo_effect":"rainbow_hologram"},"text_style":{"title_color":"#fdf2f8","subtitle_color":"#f472b6","badge_bg":"rgba(236, 72, 153, 0.45)"},"layout_config":{"text_align":"center","aspect_ratio":"2/3","badge_position":"top-right","show_resonator_badge":true}}'::jsonb,
  true, 250, 0, true, '{"hp":4800,"atk":460,"def":255,"heal":250,"shield":380,"speed":124,"energy":100,"crit_rate":26,"crit_dmg":178,"lifesteal":8,"damage_reduction":11,"heal_bonus":15,"shield_bonus":15,"revive_count":0,"revive_hp_pct":35}'::jsonb, '[{"id":"sk_fflpv5","name":"تفكيك الترددات الخارق","description":"انهيار دفاعات الخصم بنسبة 35% وتوجيه ضربة صاعقة مضاعفة","type":"debuff","target":"opponent","effect_type":"def_debuff","value":35,"value_type":"percentage","energy_cost":40,"cooldown":3,"max_uses":3},{"id":"sk_01jf7t","name":"مدار الأصداء المتشابك","description":"شحن قتالي واسع يمنح درعاً وهجوماً مرتفعاً في آن واحد","type":"shield","target":"self","effect_type":"shield","value":340,"value_type":"flat","energy_cost":35,"cooldown":2,"max_uses":4}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.cards WHERE name = 'Zhezhi - ريشة الخلود والثلج الأزلي'
);