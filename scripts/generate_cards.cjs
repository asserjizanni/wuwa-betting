// generator script to create 93 diverse cards across 48 characters
const fs = require('fs');
const path = require('path');

const CHARACTERS = [
  { id: "b51777d4-80f0-4ae6-baf5-69c8166694d9", name: "Aemeath", alt: "إيميث", element: "Spectro", image: "/characters/aemeath.webp" },
  { id: "b4af7ad8-f7be-4d59-8451-012db9632639", name: "Augusta", alt: "أوغوستا", element: "Havoc", image: "/characters/augusta.webp" },
  { id: "4e6f0d24-8e45-40ac-bb71-0495bee96efa", name: "Baizhi", alt: "بايزي", element: "Glacio", image: "/characters/baizhi.webp" },
  { id: "8d797e5a-330e-4376-90ab-bc7c0c0f86ae", name: "Brant", alt: "برانت", element: "Fusion", image: "/characters/brant.webp" },
  { id: "1d6fe0c3-04cb-4275-ac1c-dfbe0d2809f2", name: "Buling", alt: "بولينغ", element: "Electro", image: "/characters/buling.webp" },
  { id: "6ce2878c-062c-4b1b-88c4-3de756a7d1e9", name: "Calcharo", alt: "كالكارو", element: "Electro", image: "/characters/calcharo.webp" },
  { id: "cb30771a-9869-4c6b-b32b-656b5447ca1a", name: "Camellya", alt: "كاميليا", element: "Havoc", image: "/characters/camellya.webp" },
  { id: "9803bb39-3594-4460-9897-ab017266b62a", name: "Cantarella", alt: "كانتاريلا", element: "Glacio", image: "/characters/cantarella.webp" },
  { id: "9625b966-b0db-4751-81a5-9063d3cd84b0", name: "Carlotta", alt: "كارلوتا", element: "Spectro", image: "/characters/carlotta.webp" },
  { id: "99be4f7d-338e-4b90-8871-9e0b4c4e0157", name: "Cartethyia", alt: "كارتيثيا", element: "Aero", image: "/characters/cartethyia.webp" },
  { id: "57542e8e-ac9a-4d6d-8bf2-a8f3a59b585f", name: "Changli", alt: "تشانغلي", element: "Fusion", image: "/characters/changli.webp" },
  { id: "6dcd4fc2-f861-4ca1-941d-8d177d5d38e8", name: "Chisa", alt: "تشيسا", element: "Glacio", image: "/characters/chisa.webp" },
  { id: "eaddff0b-dcc6-4611-b7ac-2a5ce49f8e71", name: "Ciaccona", alt: "تشاكونا", element: "Aero", image: "/characters/ciaccona.webp" },
  { id: "62e789b2-a749-496f-aa6c-04ba1bc8bbd2", name: "Danjin", alt: "دانجين", element: "Havoc", image: "/characters/danjin.webp" },
  { id: "968bbfa8-8997-49e5-a885-146a30af4d74", name: "Denia", alt: "دينيا", element: "Electro", image: "/characters/denia.webp" },
  { id: "10ff101d-6875-4e25-a7af-ce8156072736", name: "Encore", alt: "أنكور", element: "Fusion", image: "/characters/encore.webp" },
  { id: "18f0af0a-47e0-4b87-91c7-d5edab662587", name: "Galbrena", alt: "غالبرينا", element: "Havoc", image: "/characters/galbrena.webp" },
  { id: "109d4044-af0d-4964-8912-abb83e20072c", name: "Hiyuki", alt: "هيوكي", element: "Glacio", image: "/characters/hiyuki.webp" },
  { id: "31707fa9-a8c7-449d-9024-48e336f34055", name: "Hsin", alt: "هسين", element: "Spectro", image: "/characters/hsin.webp" },
  { id: "33cdddd6-4e41-4eb4-9d99-bf9f6a821ba9", name: "Iuno", alt: "إيونو", element: "Aero", image: "/characters/iuno.webp" },
  { id: "b1bcbd1f-f6b1-4344-93a8-502fce52a6bb", name: "Jianxin", alt: "جيانشين", element: "Aero", image: "/characters/jianxin.webp" },
  { id: "23823db3-7a85-4b46-a8c1-3e47d70fa970", name: "Jingran", alt: "جينغران", element: "Fusion", image: "/characters/jingran.webp" },
  { id: "2f2da6f0-5bc8-4936-841b-b26acc040721", name: "Jinhsi", alt: "جينشي", element: "Spectro", image: "/characters/jinshi.webp" },
  { id: "c2a8cbd4-ad7c-4366-b00d-cdd48639a5b0", name: "Jiyan", alt: "جيان", element: "Aero", image: "/characters/jiyan.webp" },
  { id: "fde0b657-cf06-406f-ac05-a2c3fced705a", name: "Lingyang", alt: "لينغيانغ", element: "Glacio", image: "/characters/lingyang.webp" },
  { id: "4c7b566f-2dfe-4674-adbd-14c46d16c09f", name: "Lucilla", alt: "لوسيلا", element: "Spectro", image: "/characters/lucilla.webp" },
  { id: "ab11334a-50ea-4a7a-9a18-b1e9ad014bb7", name: "Lucy", alt: "لوسي", element: "Electro", image: "/characters/lucy.webp" },
  { id: "6be043c0-3d87-4bef-9f6c-4727271db55e", name: "Lupa", alt: "لوبا", element: "Havoc", image: "/characters/lupa.webp" },
  { id: "9e9b77f4-37c7-4f2f-820c-9c8c6c136865", name: "Luuk", alt: "لوك", element: "Aero", image: "/characters/luuk.webp" },
  { id: "19ad9c10-649c-4a88-a574-039e59c78905", name: "Lynae", alt: "ليناي", element: "Glacio", image: "/characters/lynae.webp" },
  { id: "ce34e89a-aee0-4cd9-bd6c-1db60fa3ca95", name: "Mornye", alt: "مورني", element: "Fusion", image: "/characters/mornye.webp" },
  { id: "28dfd3aa-f171-43ef-bc50-b9a383bd23f5", name: "Phoebe", alt: "فيبي", element: "Spectro", image: "/characters/phoebe.webp" },
  { id: "c943c09f-07f3-4dc1-8b63-7f7df60c2be1", name: "Phrolova", alt: "فرولوفا", element: "Havoc", image: "/characters/phrolova.webp" },
  { id: "fc04ec2b-e0a5-45a6-a236-0c5d1f4d7cde", name: "Qingxiao", alt: "تشينغشياو", element: "Aero", image: "/characters/qingxiao.webp" },
  { id: "a2876b25-83aa-42de-a3b7-b3495fb1d12f", name: "Qiuyuan", alt: "تشيويوان", element: "Spectro", image: "/characters/qiuyuan.webp" },
  { id: "e769a4e2-6535-4a69-b3b4-4c83852a977f", name: "Rebecca", alt: "ريبيكا", element: "Electro", image: "/characters/rebecca.webp" },
  { id: "c693cc32-627d-4007-81f9-71c504cd68a7", name: "Roccia", alt: "روتشيا", element: "Glacio", image: "/characters/roccia.webp" },
  { id: "26103e67-feaf-4aa5-92ab-bc8fbae067d9", name: "Rover Electro", alt: "روفر البرق", element: "Electro", image: "/characters/rover-electro.webp" },
  { id: "a3e9651d-1632-4389-9744-1bcf145d923f", name: "Sigrika", alt: "سيغريكا", element: "Havoc", image: "/characters/sigrika.webp" },
  { id: "ebee65bb-6e49-4f1e-9d9f-49ef82c238f4", name: "Suisui", alt: "سويسوي", element: "Spectro", image: "/characters/suisui.webp" },
  { id: "4c6e5d33-e7f5-439e-976f-fdc14cd12cb0", name: "Taoqi", alt: "تاوتشي", element: "Havoc", image: "/characters/taoqi.webp" },
  { id: "9b8da9d8-274f-4f6c-aacb-220753b4e6b4", name: "The Shorekeeper", alt: "شوركيبر", element: "Spectro", image: "/characters/the shorkepeer.webp" },
  { id: "2c4ee914-0084-48ed-86a3-40b5c2feb1d1", name: "Verina", alt: "فيرينا", element: "Spectro", image: "/characters/verina.webp" },
  { id: "e1fd2df1-591e-4bab-9e24-597295888f5e", name: "Xiangliyao", alt: "شيانغلياوا", element: "Electro", image: "/characters/xiangliyao.webp" },
  { id: "10870b6b-37ec-48be-a145-964df2ec8188", name: "Yangyang", alt: "يانغيانغ", element: "Aero", image: "/characters/yangyang.webp" },
  { id: "3f6f9fd6-cd13-4410-963a-819fcbb347e1", name: "Yinlin", alt: "ينلين", element: "Electro", image: "/characters/yinlin.webp" },
  { id: "aac533c9-f6e5-4089-8dc5-62671a9bf8bd", name: "Zani", alt: "زاني", element: "Fusion", image: "/characters/zani.webp" },
  { id: "602171e3-4af0-45bb-a2ff-ef41f937cdae", name: "Zhezhi", alt: "جيجي", element: "Glacio", image: "/characters/zhezhi.webp" },
];

const TEMPLATES = {
  rare: "6359bb27-7a1e-43b7-9ad9-54ee8fafeaab",
  epic: "b6b3050e-9bef-4e79-a903-2a4755671062",
  legendary: "2af06728-a288-4ec7-b8b7-363953777d0e",
  mythic: "097a12be-56b7-4d88-86d1-77d34bcaffdc"
};

const SET_ID = "b4734a81-46a8-4fa3-bc49-f2fc119ccd26";

// Tier Configurations
const TIER_DESIGNS = {
  rare: {
    border_color: "#38bdf8",
    bg_gradient: "linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)",
    frame_style: {
      border_width: 2.5,
      border_radius: 18,
      glow_color: "rgba(56, 189, 248, 0.45)",
      glow_spread: 14,
      holo_effect: "subtle_blue"
    },
    text_style: {
      title_color: "#f0f9ff",
      subtitle_color: "#7dd3fc",
      badge_bg: "rgba(56, 189, 248, 0.3)"
    },
    layout_config: {
      text_align: "center",
      aspect_ratio: "2/3",
      badge_position: "top-right",
      show_resonator_badge: true
    }
  },
  epic: {
    border_color: "#c084fc",
    bg_gradient: "linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)",
    frame_style: {
      border_width: 3.0,
      border_radius: 20,
      glow_color: "rgba(192, 132, 252, 0.65)",
      glow_spread: 20,
      holo_effect: "purple_pulse"
    },
    text_style: {
      title_color: "#faf5ff",
      subtitle_color: "#d8b4fe",
      badge_bg: "rgba(168, 85, 247, 0.35)"
    },
    layout_config: {
      text_align: "center",
      aspect_ratio: "2/3",
      badge_position: "top-right",
      show_resonator_badge: true
    }
  },
  legendary: {
    border_color: "#f59e0b",
    bg_gradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)",
    frame_style: {
      border_width: 3.5,
      border_radius: 22,
      glow_color: "rgba(245, 158, 11, 0.8)",
      glow_spread: 28,
      holo_effect: "golden_rays"
    },
    text_style: {
      title_color: "#fffbeb",
      subtitle_color: "#fcd34d",
      badge_bg: "rgba(245, 158, 11, 0.4)"
    },
    layout_config: {
      text_align: "center",
      aspect_ratio: "2/3",
      badge_position: "top-right",
      show_resonator_badge: true
    }
  },
  mythic: {
    border_color: "#ec4899",
    bg_gradient: "linear-gradient(135deg, #18181b 0%, #312e81 33%, #701a75 66%, #831843 100%)",
    frame_style: {
      border_width: 4.0,
      border_radius: 24,
      glow_color: "rgba(236, 72, 153, 0.95)",
      glow_spread: 35,
      holo_effect: "rainbow_hologram"
    },
    text_style: {
      title_color: "#fdf2f8",
      subtitle_color: "#f472b6",
      badge_bg: "rgba(236, 72, 153, 0.45)"
    },
    layout_config: {
      text_align: "center",
      aspect_ratio: "2/3",
      badge_position: "top-right",
      show_resonator_badge: true
    }
  }
};

// Roles & Combat Archetypes
function generateStatsAndSkills(rarity, role, element) {
  let hp, atk, def, heal, shield, speed, crit_rate, crit_dmg, lifesteal, damage_reduction;
  let skills = [];

  if (rarity === 'rare') { // متوسطة
    if (role === 'striker') {
      hp = 1750; atk = 185; def = 80; heal = 0; shield = 0; speed = 108; crit_rate = 14; crit_dmg = 150; lifesteal = 0; damage_reduction = 2;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'ضربة الصدى',
        description: 'هجوم مباشر يوجه ضرراً مركزاً لنقطة ضعف الخصم',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 130,
        value_type: 'flat',
        energy_cost: 20,
        cooldown: 1,
        max_uses: 99
      });
    } else if (role === 'tank') {
      hp = 2150; atk = 135; def = 115; heal = 0; shield = 150; speed = 96; crit_rate = 8; crit_dmg = 140; lifesteal = 0; damage_reduction = 6;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'درع الصد',
        description: 'تفعيل حاجز واقٍ يمتص هجمات الخصم القادمة',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 180,
        value_type: 'flat',
        energy_cost: 25,
        cooldown: 2,
        max_uses: 5
      });
    } else if (role === 'healer') {
      hp = 1900; atk = 140; def = 90; heal = 160; shield = 50; speed = 100; crit_rate = 10; crit_dmg = 140; lifesteal = 0; damage_reduction = 4;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'ترميم طاقي',
        description: 'استعادة نسبة من نقاط الحياة وتثبيت المؤشرات الحيوية',
        type: 'heal',
        target: 'self',
        effect_type: 'heal',
        value: 170,
        value_type: 'flat',
        energy_cost: 25,
        cooldown: 2,
        max_uses: 6
      });
    } else { // support / tactical
      hp = 1850; atk = 155; def = 95; heal = 80; shield = 100; speed = 105; crit_rate = 12; crit_dmg = 145; lifesteal = 0; damage_reduction = 3;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'نبض الإرباك',
        description: 'إطلاق موجة ترددية تقلل من دفاع وتركيز الخصم',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'def_debuff',
        value: 15,
        value_type: 'percentage',
        energy_cost: 20,
        cooldown: 2,
        max_uses: 4
      });
    }
  } else if (rarity === 'epic') { // قوية
    if (role === 'striker') {
      hp = 2650; atk = 285; def = 115; heal = 0; shield = 0; speed = 114; crit_rate = 19; crit_dmg = 162; lifesteal = 5; damage_reduction = 3;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'حد النصل المتفجر',
        description: 'هجوم حاسم متزامن يسبب ضرراً مضافاً للخصم',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 230,
        value_type: 'flat',
        energy_cost: 25,
        cooldown: 2,
        max_uses: 99
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'شحنة الحسم',
        description: 'زيادة مؤقتة في نسبة الضربة الحرجة للهجمة القادمة',
        type: 'buff',
        target: 'self',
        effect_type: 'damage',
        value: 15,
        value_type: 'percentage',
        energy_cost: 30,
        cooldown: 3,
        max_uses: 3
      });
    } else if (role === 'tank') {
      hp = 3200; atk = 210; def = 165; heal = 0; shield = 280; speed = 99; crit_rate = 12; crit_dmg = 145; lifesteal = 0; damage_reduction = 10;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'جدار الحصانة المصفح',
        description: 'تشييد حاجز متين يمتص الأضرار الجسيمة ويرد جزءاً منها',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 300,
        value_type: 'flat',
        energy_cost: 30,
        cooldown: 2,
        max_uses: 4
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'تثبيت الصمود',
        description: 'تقليص الضرر المتلقى بنسبة 20% لجولة كاملة',
        type: 'buff',
        target: 'self',
        effect_type: 'damage_reduction',
        value: 20,
        value_type: 'percentage',
        energy_cost: 25,
        cooldown: 3,
        max_uses: 3
      });
    } else if (role === 'healer') {
      hp = 2850; atk = 220; def = 130; heal = 260; shield = 120; speed = 106; crit_rate = 14; crit_dmg = 145; lifesteal = 4; damage_reduction = 5;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'فيض الحياة المتجدد',
        description: 'علاج فوري وترميم مستمر لنقاط الصحة',
        type: 'heal',
        target: 'self',
        effect_type: 'heal',
        value: 270,
        value_type: 'flat',
        energy_cost: 30,
        cooldown: 2,
        max_uses: 5
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'تطهير التردد',
        description: 'إزالة التأثيرات السلبية وتوليد درع وقاية خفيف',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 140,
        value_type: 'flat',
        energy_cost: 20,
        cooldown: 3,
        max_uses: 3
      });
    } else { // support / tactical
      hp = 2750; atk = 240; def = 135; heal = 130; shield = 180; speed = 112; crit_rate = 16; crit_dmg = 152; lifesteal = 0; damage_reduction = 6;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'شلل التردد الصاعق',
        description: 'إضعاف هجوم الخصم وتعطيل تقدمه السريع',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'atk_debuff',
        value: 20,
        value_type: 'percentage',
        energy_cost: 25,
        cooldown: 2,
        max_uses: 4
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'نبض الدعم التكتيكي',
        description: 'شحن طاقة المعركة وتعزيز الفعالية القتالية',
        type: 'buff',
        target: 'self',
        effect_type: 'damage',
        value: 120,
        value_type: 'flat',
        energy_cost: 25,
        cooldown: 2,
        max_uses: 4
      });
    }
  } else if (rarity === 'legendary') { // قوية جدًا
    if (role === 'striker') {
      hp = 3650; atk = 395; def = 175; heal = 0; shield = 0; speed = 120; crit_rate = 24; crit_dmg = 175; lifesteal = 8; damage_reduction = 5;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'إعصار الهيمنة القاصم',
        description: 'ضربة أسطورية خارقة للدروع تصيب عمق تشكيلة الخصم',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 360,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 99
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'غريزة الصيد المفترس',
        description: 'رفع الضرر الحرج وسرقة جزء من نقاط حياة الخصم مع كل إصابة',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 180,
        value_type: 'flat',
        energy_cost: 30,
        cooldown: 3,
        max_uses: 3
      });
    } else if (role === 'tank') {
      hp = 4300; atk = 320; def = 225; heal = 0; shield = 420; speed = 104; crit_rate = 15; crit_dmg = 150; lifesteal = 0; damage_reduction = 14;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'حصن النواة المنيع',
        description: 'توليد هالة درعية عظيمة تمتص صدمات المعركة العنيفة',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 450,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'درع الرد التدميري',
        description: 'ردع الهجمات المباشرة مع تخفيض ضرر الخصم بنسبة 25%',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'atk_debuff',
        value: 25,
        value_type: 'percentage',
        energy_cost: 30,
        cooldown: 3,
        max_uses: 3
      });
    } else if (role === 'healer') {
      hp = 3900; atk = 330; def = 185; heal = 370; shield = 210; speed = 112; crit_rate = 18; crit_dmg = 155; lifesteal = 7; damage_reduction = 8;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'معجزة الانبعاث الربيعي',
        description: 'شفاء أسطوري مكثف يعيد ملء معظم شريط الصحة',
        type: 'heal',
        target: 'self',
        effect_type: 'heal',
        value: 390,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'حجاب القداسة النير',
        description: 'منح درع طيفي وحصانة مؤقتة من الضربات القاتلة',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 240,
        value_type: 'flat',
        energy_cost: 30,
        cooldown: 3,
        max_uses: 3
      });
    } else { // support / tactical
      hp = 3800; atk = 350; def = 190; heal = 190; shield = 260; speed = 118; crit_rate = 22; crit_dmg = 165; lifesteal = 5; damage_reduction = 9;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'كسر الموازين الإيقاعي',
        description: 'تجريد دفاع الخصم بنسبة 30% وإلحاق صدمة حرجة مفاجئة',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'def_debuff',
        value: 30,
        value_type: 'percentage',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'طوفان الشحنات الإضافية',
        description: 'هجوم متسلسل يدعم الضرر المباشر ويرفع مستوى الطاقة',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 260,
        value_type: 'flat',
        energy_cost: 30,
        cooldown: 2,
        max_uses: 4
      });
    }
  } else { // mythic - أسطورية جدًا
    if (role === 'striker') {
      hp = 4650; atk = 495; def = 240; heal = 0; shield = 0; speed = 126; crit_rate = 29; crit_dmg = 188; lifesteal = 12; damage_reduction = 7;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'انفجار التردد السرمدي',
        description: 'إطلاق العنان لقوة العنصر المطلقة بضربة كونية ساحقة لا تصد',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 490,
        value_type: 'flat',
        energy_cost: 40,
        cooldown: 3,
        max_uses: 3
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'رقصة النجوم الممزقة',
        description: 'هجوم حاسم فائق يمتص 15% من صحة الخصم لترميم المستخدم',
        type: 'attack',
        target: 'opponent',
        effect_type: 'damage',
        value: 320,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
    } else if (role === 'tank') {
      hp = 5350; atk = 425; def = 285; heal = 0; shield = 550; speed = 110; crit_rate = 18; crit_dmg = 160; lifesteal = 0; damage_reduction = 18;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'قبة الأبدية الفولاذية',
        description: 'درع خرافي عملاق يعزل 550 ضرراً ويمنع السقوط الحاسم',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 580,
        value_type: 'flat',
        energy_cost: 40,
        cooldown: 3,
        max_uses: 3
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'ارتداد الزلزال الكوني',
        description: 'عكس نسبة 30% من الأضرار للخصم مع تقليص هجومه',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'atk_debuff',
        value: 30,
        value_type: 'percentage',
        energy_cost: 35,
        cooldown: 3,
        max_uses: 3
      });
    } else if (role === 'healer') {
      hp = 4950; atk = 430; def = 250; heal = 480; shield = 320; speed = 116; crit_rate = 20; crit_dmg = 165; lifesteal = 10; damage_reduction = 10;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'الولادة الجديدة من الرماد',
        description: 'شفاء خرافي فوري يملأ معظم الصحة مع منح نهضة ثانية',
        type: 'heal',
        target: 'self',
        effect_type: 'heal',
        value: 520,
        value_type: 'flat',
        energy_cost: 40,
        cooldown: 3,
        max_uses: 2
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'هالة الضياء المطلق',
        description: 'درع طيفي يرفع كافة الدفاعات ويقاوم الضربات الحرجة',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 360,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
    } else { // support / tactical
      hp = 4800; atk = 460; def = 255; heal = 250; shield = 380; speed = 124; crit_rate = 26; crit_dmg = 178; lifesteal = 8; damage_reduction = 11;
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'تفكيك الترددات الخارق',
        description: 'انهيار دفاعات الخصم بنسبة 35% وتوجيه ضربة صاعقة مضاعفة',
        type: 'debuff',
        target: 'opponent',
        effect_type: 'def_debuff',
        value: 35,
        value_type: 'percentage',
        energy_cost: 40,
        cooldown: 3,
        max_uses: 3
      });
      skills.push({
        id: 'sk_' + Math.random().toString(36).substr(2, 6),
        name: 'مدار الأصداء المتشابك',
        description: 'شحن قتالي واسع يمنح درعاً وهجوماً مرتفعاً في آن واحد',
        type: 'shield',
        target: 'self',
        effect_type: 'shield',
        value: 340,
        value_type: 'flat',
        energy_cost: 35,
        cooldown: 2,
        max_uses: 4
      });
    }
  }

  const stats = {
    hp,
    atk,
    def,
    heal,
    shield,
    speed,
    energy: 100,
    crit_rate,
    crit_dmg,
    lifesteal,
    damage_reduction,
    heal_bonus: heal > 0 ? 15 : 0,
    shield_bonus: shield > 0 ? 15 : 0,
    revive_count: rarity === 'mythic' && role === 'healer' ? 1 : 0,
    revive_hp_pct: 35
  };

  return { stats, skills };
}

// Generate the 93 cards
const CARDS_PLAN = [];

// Tier targets:
// Rare: 25 cards
// Epic: 30 cards
// Legendary: 22 cards
// Mythic: 16 cards
// Total = 93 cards (+ 7 existing in DB = 100 total cards)

// 1. Rare Cards (25 cards) - متوسطة
const RARE_CHARS = [
  { char: "Buling", role: "striker", title: "صاعقة الميدان", sub: "مقاتلة كهربائية طليعية", deco: "STRIKER" },
  { char: "Chisa", role: "tactical", title: "قناصة الجليد", sub: "دعم تكتيكي ومراقبة", deco: "SCOUT" },
  { char: "Denia", role: "striker", title: "شحنة التماس", sub: "هجوم صاعق سريع", deco: "SKIRMISHER" },
  { char: "Hiyuki", role: "tank", title: "درع الشتاء", sub: "مدافعة صلبة كالصخر", deco: "DEFENDER" },
  { char: "Hsin", role: "healer", title: "ضوء السكينة", sub: "مداوية أطياف هادئة", deco: "HEALER" },
  { char: "Iuno", role: "tactical", title: "نسيم الرصد", sub: "ملاحة الرياح والاستكشاف", deco: "NAVIGATOR" },
  { char: "Lingyang", role: "striker", title: "قفزة الأسد الجليدي", sub: "مهاجم جليدي رشيق", deco: "DUALIST" },
  { char: "Lucy", role: "tactical", title: "إيقاع الشرار", sub: "إرباك كهربائي ودعم", deco: "DISRUPTOR" },
  { char: "Luuk", role: "striker", title: "عاصفة السهول", sub: "مهاجم هوائي مباغت", deco: "STRIKER" },
  { char: "Lynae", role: "healer", title: "بلسم الصقيع", sub: "ترميم الجراح الباردة", deco: "HEALER" },
  { char: "Mornye", role: "striker", title: "لهب المداخن", sub: "هجوم ناري مشتعل", deco: "PYRO" },
  { char: "Phoebe", role: "healer", title: "ترتيلة الشفاء", sub: "كاهنة الضياء الطيفي", deco: "PRIESTESS" },
  { char: "Qingxiao", role: "tactical", title: "سيف الخيزران", sub: "انسيابية وسرعة مناورة", deco: "BLADE" },
  { char: "Qiuyuan", role: "tactical", title: "انعكاس البريق", sub: "مرآة الضوء المضلل", deco: "TACTICIAN" },
  { char: "Rebecca", role: "striker", title: "محرك الصعق", sub: "تقنية كهربائية هجومية", deco: "STRIKER" },
  { char: "Roccia", role: "tank", title: "جلمود الجليد", sub: "حائط صد ثلجي منيع", deco: "GUARDIAN" },
  { char: "Sigrika", role: "striker", title: "شفرة الظلال", sub: "اغتيال من الهاوية", deco: "ASSASSIN" },
  { char: "Suisui", role: "healer", title: "قطرات الندى", sub: "تجدد طيفي منعش", deco: "HEALER" },
  { char: "Yangyang", role: "tactical", title: "ريشة النسيم", sub: "شحن طاقة واستعادة هدوء", deco: "SUPPORT" },
  { char: "Zani", role: "striker", title: "شرارة الوميض", sub: "هجمات نارية متلاحقة", deco: "SKIRMISHER" },
  { char: "Brant", role: "tank", title: "مرساة السفينة", sub: "دفاع ناري بحري صلب", deco: "VANGUARD" },
  { char: "Cantarella", role: "tactical", title: "همس الصقيع", sub: "إبطاء وتعطيل الأعداء", deco: "CONTROLLER" },
  { char: "Carlotta", role: "striker", title: "صولجان النور", sub: "ضربات طيفية براقة", deco: "STRIKER" },
  { char: "Cartethyia", role: "healer", title: "فراشة الأثير", sub: "معالجة رياح خفيفة", deco: "HEALER" },
  { char: "Galbrena", role: "tank", title: "حجر الصوان", sub: "مقاومة صلبة للضرر", deco: "TANK" }
];

RARE_CHARS.forEach(rc => {
  const charObj = CHARACTERS.find(c => c.name.toLowerCase() === rc.char.toLowerCase());
  if (!charObj) throw new Error("Character not found: " + rc.char);
  const { stats, skills } = generateStatsAndSkills('rare', rc.role, charObj.element);
  CARDS_PLAN.push({
    character_id: charObj.id,
    name: `${charObj.name} - ${rc.title}`,
    title: rc.title,
    subtitle: rc.sub,
    decorative_text: rc.deco,
    element: charObj.element,
    rarity: 'rare',
    template_id: TEMPLATES.rare,
    image_path: charObj.image,
    stats,
    skills,
    card_design_override: TIER_DESIGNS.rare,
    is_limited: false,
    max_supply: null,
    is_published: true
  });
});

// 2. Epic Cards (30 cards) - قوية
const EPIC_CHARS = [
  { char: "Aemeath", role: "tactical", title: "حارسة الطيف النقي", sub: "توجيه ترددات الضوء الكوني", deco: "ASTRAL" },
  { char: "Augusta", role: "striker", title: "قاهرة الحشود", sub: "سيف الدمار الهادر", deco: "BERSERKER" },
  { char: "Baizhi", role: "healer", title: "بلورات الهواشيو", sub: "بحوث التداوي الصقيعي المتقدم", deco: "RESEARCHER" },
  { char: "Brant", role: "striker", title: "ربان الشعلة المشتعلة", sub: "مهاجم ناري عالي الضرر", deco: "CAPTAIN" },
  { char: "Buling", role: "striker", title: "العاصفة المباغتة", sub: "هجمات صاعقة خاطفة", deco: "STRIKER" },
  { char: "Calcharo", role: "striker", title: "سيد صائدي الأشباح", sub: "مرتزق الصواعق القاتلة", deco: "MERCENARY" },
  { char: "Camellya", role: "striker", title: "أشواك الكاميليا القاتلة", sub: "إزهار الدماء والدمار", deco: "BLOOM" },
  { char: "Cantarella", role: "healer", title: "أريا التجدد الجليدي", sub: "ترميم الجسد بلحن جليدي", deco: "RESTORER" },
  { char: "Carlotta", role: "tactical", title: "أميرة الإشعاع الفضي", sub: "تعزيز طاقة وتنسيق حربي", deco: "TACTICIAN" },
  { char: "Cartethyia", role: "tactical", title: "أجنحة العاصفة الهادئة", sub: "تحكم بمجريات ساحة القتال", deco: "CONTROLLER" },
  { char: "Changli", role: "tactical", title: "مستشارة جينتشو الفذة", sub: "تخطيط استراتيجي وحصار ناري", deco: "ADVISOR" },
  { char: "Chisa", role: "striker", title: "رصاصة الصفر المطلق", sub: "قنص تجميدي خارق", deco: "SNIPER" },
  { char: "Ciaccona", role: "tactical", title: "سيمفونية الريح الطليقة", sub: "عزف ملهم يعزز الحلفاء", deco: "MINSTREL" },
  { char: "Danjin", role: "striker", title: "حد السيف القرمزي", sub: "تضحية بالصحة لمضاعفة الهجوم", deco: "DUALIST" },
  { char: "Denia", role: "tactical", title: "صمام التردد العالي", sub: "تعطيل محركات الخصم", deco: "ENGINEER" },
  { char: "Encore", role: "striker", title: "قصة وولشم المشتعلة", sub: "دمى اللهب الانفجارية", deco: "PUPPETEER" },
  { char: "Galbrena", role: "tank", title: "قبضة الدمار الزلزالية", sub: "سحق صفوف الخصم بدروع صخرية", deco: "CRUSHER" },
  { char: "Hsin", role: "tactical", title: "مرآة الحكمة القديمة", sub: "كشف نقاط ضعف الخصم", deco: "SAGE" },
  { char: "Iuno", role: "striker", title: "صقر الأفق البعيد", sub: "انقضاض هوائي جارح", deco: "STRIKER" },
  { char: "Jianxin", role: "tank", title: "دائرة الطاوية الدفاعية", sub: "تحويل قوة ضربات الخصم", deco: "MONK" },
  { char: "Jingran", role: "striker", title: "سيف الجمر المتأجج", sub: "لهيب متواصل يحرق الدروع", deco: "BLADE" },
  { char: "Lingyang", role: "striker", title: "مهرجان الوثبة الجليدية", sub: "هجمات بهلوانية قوية", deco: "FIGHTER" },
  { char: "Lucilla", role: "healer", title: "نبع الفجر المنبثق", sub: "علاج متدفق وحماية طيفية", deco: "HEALER" },
  { char: "Lucy", role: "striker", title: "تيار البرق المتردد", sub: "ضربات متتابعة تكسر الحصون", deco: "STRIKER" },
  { char: "Lupa", role: "striker", title: "ذئبة الصيد المظلمة", sub: "تمزيق خطوط الخصم المفتوحة", deco: "HUNTER" },
  { char: "Mornye", role: "tank", title: "درع الحمم البركانية", sub: "امتصاص النيران وردها صهيراً", deco: "JUGGERNAUT" },
  { char: "Phrolova", role: "tactical", title: "أوتار اللحن الكئيب", sub: "إضعاف دمار شامل للمنافس", deco: "MAESTRO" },
  { char: "Roccia", role: "tank", title: "متراس الثلج الأبدي", sub: "حصانة عالية ضد الصدمات", deco: "BASTION" },
  { char: "Rover Electro", role: "striker", title: "صدى الصواعق المتجددة", sub: "هجوم متزن ومتكيف مع الميدان", deco: "RESONATOR" },
  { char: "Taoqi", role: "tank", title: "سيف الحصانة الثقيل", sub: "دفاع حديدي وتأمين الحلفاء", deco: "GUARDIAN" }
];

EPIC_CHARS.forEach(ec => {
  const charObj = CHARACTERS.find(c => c.name.toLowerCase() === ec.char.toLowerCase());
  if (!charObj) throw new Error("Character not found: " + ec.char);
  const { stats, skills } = generateStatsAndSkills('epic', ec.role, charObj.element);
  CARDS_PLAN.push({
    character_id: charObj.id,
    name: `${charObj.name} - ${ec.title}`,
    title: ec.title,
    subtitle: ec.sub,
    decorative_text: ec.deco,
    element: charObj.element,
    rarity: 'epic',
    template_id: TEMPLATES.epic,
    image_path: charObj.image,
    stats,
    skills,
    card_design_override: TIER_DESIGNS.epic,
    is_limited: false,
    max_supply: null,
    is_published: true
  });
});

// 3. Legendary Cards (22 cards) - قوية جدًا
const LEGENDARY_CHARS = [
  { char: "Augusta", role: "striker", title: "أميرة الهاوية الدامية", sub: "سحق كامل لا يعرف التراجع", deco: "SOVEREIGN" },
  { char: "Baizhi", role: "healer", title: "التردد الصقيعي المطلق", sub: "درع جليدي متقدم وشفاء فوري", deco: "ARCH-SCHOLAR" },
  { char: "Brant", role: "striker", title: "قبطان الأسطول المشتعل", sub: "مدافع نارية تصهر دفاعات الخصم", deco: "ADMIRAL" },
  { char: "Calcharo", role: "striker", title: "شبح الظلال الرعدي", sub: "سيف البرق الهائج وسرعة خارقة", deco: "SHADOW" },
  { char: "Camellya", role: "striker", title: "كاميليا النشوة القرمزية", sub: "حبال الدمار الخانقة والضربات القاتلة", deco: "HARVESTER" },
  { char: "Cantarella", role: "tactical", title: "سيدة القلعة الجليدية", sub: "تجميد شامل وشلل ترددات الخصم", deco: "QUEEN" },
  { char: "Danjin", role: "striker", title: "هياج النصل القرمزي", sub: "قوة مضاعفة تعتمد على شراسة الهجوم", deco: "SLAYER" },
  { char: "Encore", role: "striker", title: "مسرح اللهب الخيالي", sub: "دمى متفجرة تغمر الحلبة بالنار", deco: "FANTASY" },
  { char: "Jianxin", role: "tank", title: "سيدة التناغم والرياح العظمى", sub: "درع طاوية يبتلع أقوى الهجمات", deco: "GRANDMASTER" },
  { char: "Jinhsi", role: "striker", title: "قاضية جينتشو المتألقة", sub: "حكم الضوء الأبدي ونصل العدالة", deco: "MAGISTRATE" },
  { char: "Jiyan", role: "striker", title: "قائد حراس منتصف الليل", sub: "قيادة عسكرية وضربات رمح ثاقبة", deco: "GENERAL" },
  { char: "Lupa", role: "striker", title: "مفترسة قمر الدمار", sub: "هجمات وحشية تنهك قوى الخصوم", deco: "ALPHA" },
  { char: "Phoebe", role: "healer", title: "رسولة الأنوار الخالدة", sub: "إنقاذ فائق وحجاب طيفي مانع للهلاك", deco: "SERAPH" },
  { char: "Phrolova", role: "tactical", title: "عازفة ألحان الفناء", sub: "تفكيك طاقة الخصم وتخفيض دفاعاته", deco: "VIRTUOSO" },
  { char: "Qingxiao", role: "striker", title: "سيف الريح الشاهقة", sub: "شفرات هوائية تخترق أعتى الدروع", deco: "SWORDMASTER" },
  { char: "Rover Electro", role: "striker", title: "روفر صحوة الصواعق", sub: "تناغم ترددات البرق بضربات حاسمة", deco: "CHOSEN" },
  { char: "Taoqi", role: "tank", title: "الحصن المنيع المصفح", sub: "درع صلب يردع أعتى الضربات ويحمي الفريق", deco: "FORTRESS" },
  { char: "The Shorekeeper", role: "healer", title: "حارسة الشاطئ الأزلي", sub: "تدفق طيفي يرمم قوى الحياة بالكامل", deco: "STEWARD" },
  { char: "Verina", role: "healer", title: "حارسة مروج الحياة", sub: "إنعاش ربيعي يمنع السقوط الحاسم", deco: "FLORIST" },
  { char: "Xiangliyao", role: "tactical", title: "نابغة التردد الكهرومغناطيسي", sub: "ذراع آلية متطورة وحسابات دقيقة", deco: "GENIUS" },
  { char: "Yinlin", role: "striker", title: "العازفة على خيوط الرعد", sub: "شبكة كهربائية تصعق وتشل حركة الخصم", deco: "PUPPETEER" },
  { char: "Zhezhi", role: "tactical", title: "رسامة الرافعات الجليدية", sub: "لوحات سحرية تستدعي كائنات صقيعية داعمة", deco: "CALLIGRAPHER" }
];

LEGENDARY_CHARS.forEach(lc => {
  const charObj = CHARACTERS.find(c => c.name.toLowerCase() === lc.char.toLowerCase());
  if (!charObj) throw new Error("Character not found: " + lc.char);
  const { stats, skills } = generateStatsAndSkills('legendary', lc.role, charObj.element);
  CARDS_PLAN.push({
    character_id: charObj.id,
    name: `${charObj.name} - ${lc.title}`,
    title: lc.title,
    subtitle: lc.sub,
    decorative_text: lc.deco,
    element: charObj.element,
    rarity: 'legendary',
    template_id: TEMPLATES.legendary,
    image_path: charObj.image,
    stats,
    skills,
    card_design_override: TIER_DESIGNS.legendary,
    is_limited: true,
    max_supply: 500,
    is_published: true
  });
});

// 4. Mythic Cards (16 cards) - أسطورية جدًا
const MYTHIC_CHARS = [
  { char: "Aemeath", role: "tactical", title: "سيدة التردد الكوني الأزلي", sub: "تجلٍ أسطوري يطوع طيف الفضاء", deco: "COSMIC SOVEREIGN" },
  { char: "Augusta", role: "striker", title: "إمبراطورة دمار القيامة", sub: "طاقة فناء ساحقة تزعزع أركان الحلبة", deco: "APOCALYPSE" },
  { char: "Calcharo", role: "striker", title: "صاعقة الفجر الأسود المطلقة", sub: "شبح البرق المتعالي عن حدود الموت", deco: "THUNDER GOD" },
  { char: "Camellya", role: "striker", title: "كاميليا سرمدية الدماء والظلال", sub: "فخاخ الهاوية السرمدية والافتراس الكامل", deco: "BLOOD EMPRESS" },
  { char: "Changli", role: "striker", title: "عنقاء اللهب السماوي الخالدة", sub: "احتراق فلكي يعيد إشعال نيران النصر", deco: "IMMORTAL PHOENIX" },
  { char: "Danjin", role: "striker", title: "نصل الجحيم القرمزي الأبدي", sub: "عاصفة دماء تفجر كل ما يقف في طريقها", deco: "CRIMSON FIEND" },
  { char: "Encore", role: "striker", title: "حلم الفجر المشتعل الأعظم", sub: "طاقة إشعاع ملتهبة تقلب موازين النزال", deco: "SOLAR CHILD" },
  { char: "Jianxin", role: "tank", title: "إلهة التاي تشي والسكينة المطلقة", sub: "درع كوني محكم يمتص أشد الضربات ويردها", deco: "DIVINE MONK" },
  { char: "Jinhsi", role: "striker", title: "سيدة تنين الضوء جيوكسيانغ", sub: "سيف النور الإلهي الحاسم لكل صراع", deco: "DRAGON SOVEREIGN" },
  { char: "Jiyan", role: "striker", title: "غضب تنين منتصف الليل الخالد", sub: "زئير الرياح العاتية وهدير النصر العسكري", deco: "DRAGON GENERAL" },
  { char: "Phrolova", role: "tactical", title: "سيمفونية الفوضى الكونية العظمى", sub: "صمت تام وترددات تعزل الخصم عن قواه", deco: "REQUIEM" },
  { char: "The Shorekeeper", role: "healer", title: "سيدة البحر الأسود ومجرى النجوم", sub: "نبض الحياة الأسمى والإنعاش الإعجازي", deco: "BLACK SHORE RULER" },
  { char: "Verina", role: "healer", title: "شجرة العالم والازدهار السرمدي", sub: "ينبوع حياة متجدد يمنع الهزيمة", deco: "YGGDRASIL" },
  { char: "Xiangliyao", role: "tactical", title: "عقل التردد الكمي الفائق", sub: "تلاعب بحقول الطاقة وسحق كهرومغناطيسي", deco: "QUANTUM ARCHITECT" },
  { char: "Yinlin", role: "striker", title: "سيدة شبكة الصواعق الإمبراطورية", sub: "أسر كهربائي لا مفر منه ودمى فتاكة", deco: "LIGHTNING EMPRESS" },
  { char: "Zhezhi", role: "tactical", title: "ريشة الخلود والثلج الأزلي", sub: "تجسيد أسطوري يحيط الحلبة بجليد أبدي", deco: "CELESTIAL SCRIBE" }
];

MYTHIC_CHARS.forEach(mc => {
  const charObj = CHARACTERS.find(c => c.name.toLowerCase() === mc.char.toLowerCase());
  if (!charObj) throw new Error("Character not found: " + mc.char);
  const { stats, skills } = generateStatsAndSkills('mythic', mc.role, charObj.element);
  CARDS_PLAN.push({
    character_id: charObj.id,
    name: `${charObj.name} - ${mc.title}`,
    title: mc.title,
    subtitle: mc.sub,
    decorative_text: mc.deco,
    element: charObj.element,
    rarity: 'mythic',
    template_id: TEMPLATES.mythic,
    image_path: charObj.image,
    stats,
    skills,
    card_design_override: TIER_DESIGNS.mythic,
    is_limited: true,
    max_supply: 250,
    is_published: true
  });
});

console.log(`Generated total of ${CARDS_PLAN.length} cards planned.`);
const rarityCount = CARDS_PLAN.reduce((acc, c) => {
  acc[c.rarity] = (acc[c.rarity] || 0) + 1;
  return acc;
}, {});
console.log('Rarity distribution:', rarityCount);

// Save generated cards to JSON
const outputPath = path.join(__dirname, 'cards_seed.json');
fs.writeFileSync(outputPath, JSON.stringify(CARDS_PLAN, null, 2), 'utf8');
console.log(`Saved cards seed to ${outputPath}`);
