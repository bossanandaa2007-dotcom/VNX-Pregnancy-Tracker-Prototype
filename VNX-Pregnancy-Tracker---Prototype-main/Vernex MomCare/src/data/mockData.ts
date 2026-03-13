import { Patient, Article, GuideItem, Message, HealthEntry } from '@/types';

export const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    name: 'Emily Johnson',
    email: 'emily.j@email.com',
    age: 28,
    pregnancyStartDate: new Date('2024-06-15'),
    gestationalWeek: 24,
    contactPhone: '+1 (555) 123-4567',
    medicalNotes: 'First pregnancy. No complications observed.',
    riskStatus: 'normal',
    doctorId: 'doc-001',
    createdAt: new Date('2024-07-01'),
  },
  {
    id: 'pat-002',
    name: 'Sarah Williams',
    email: 'sarah.w@email.com',
    age: 34,
    pregnancyStartDate: new Date('2024-05-20'),
    gestationalWeek: 28,
    contactPhone: '+1 (555) 234-5678',
    medicalNotes: 'Previous C-section. Monitoring closely.',
    riskStatus: 'attention',
    doctorId: 'doc-001',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'pat-003',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    age: 31,
    pregnancyStartDate: new Date('2024-04-10'),
    gestationalWeek: 34,
    contactPhone: '+1 (555) 345-6789',
    medicalNotes: 'Gestational diabetes. Requires frequent monitoring.',
    riskStatus: 'high-risk',
    doctorId: 'doc-001',
    createdAt: new Date('2024-05-01'),
  },
  {
    id: 'pat-004',
    name: 'Jennifer Lee',
    email: 'jennifer.l@email.com',
    age: 26,
    pregnancyStartDate: new Date('2024-08-01'),
    gestationalWeek: 18,
    contactPhone: '+1 (555) 456-7890',
    riskStatus: 'normal',
    doctorId: 'doc-001',
    createdAt: new Date('2024-08-15'),
  },
  {
    id: 'pat-005',
    name: 'Amanda Chen',
    email: 'amanda.c@email.com',
    age: 29,
    pregnancyStartDate: new Date('2024-07-05'),
    gestationalWeek: 22,
    contactPhone: '+1 (555) 567-8901',
    medicalNotes: 'Twin pregnancy. Additional monitoring required.',
    riskStatus: 'attention',
    doctorId: 'doc-001',
    createdAt: new Date('2024-07-20'),
  },
];

export const mockArticles: Article[] = [
  /* ---------------- Pregnancy Stages ---------------- */
  {
    id: 'ps-1',
    title: 'First Trimester: What to Expect',
    category: 'Pregnancy Stages',
    summary: 'An overview of weeks 1-12, including early symptoms and baby development.',
    content:
      'Weeks 1 to 12 are the first trimester. This is when early pregnancy symptoms can begin and your baby starts rapid growth and development. Many people also begin antenatal care and book their first appointments during this stage.',
    readTime: 8,
    externalLink: 'https://www.nhs.uk/pregnancy/week-by-week/1-to-12/',
  },
  {
    id: 'ps-2',
    title: 'Second Trimester: Changes & Growth',
    category: 'Pregnancy Stages',
    summary: 'An overview of weeks 13-27, when many people feel better and the baby grows quickly.',
    content:
      'Weeks 13 to 27 make up the second trimester. Symptoms often ease, energy may improve, and the baby grows rapidly. Many people start to feel baby movements during this stage.',
    readTime: 7,
    externalLink: 'https://www.nhs.uk/pregnancy/week-by-week/13-to-27/',
  },
  {
    id: 'ps-3',
    title: 'Third Trimester: Preparing for Birth',
    category: 'Pregnancy Stages',
    summary: 'An overview of weeks 28-41, when the baby gains weight and you prepare for birth.',
    content:
      'Weeks 28 to 41 are the third trimester. Your baby continues to grow and gain weight, and you prepare for labour, birth, and care after delivery.',
    readTime: 7,
    externalLink: 'https://www.nhs.uk/pregnancy/week-by-week/28-to-41/',
  },
  {
    id: 'ps-8',
    title: 'Antenatal Care Visits (Video)',
    category: 'Pregnancy Stages',
    summary: 'Overview of antenatal visits and what to expect during pregnancy.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=op0pl5YKq5U',
  },
  {
    id: 'ps-9',
    title: "Baby's Movements Matter (Video)",
    category: 'Pregnancy Stages',
    summary: 'Learn why monitoring baby movements is important in later pregnancy.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=YQUHSXvGQ30',
  },

  /* ---------------- Diet & Nutrition ---------------- */
  {
    id: 'dn-1',
    title: 'Nutrition During Pregnancy',
    category: 'Diet & Nutrition',
    summary: 'Essential nutrients and foods for a healthy pregnancy.',
    content:
      'A balanced diet supports fetal growth and maternal health.',
    readTime: 6,
  },
  {
    id: 'dn-2',
    title: 'Foods to Avoid During Pregnancy',
    category: 'Diet & Nutrition',
    summary: 'Learn which foods can be harmful during pregnancy.',
    content:
      'Certain foods may increase the risk of infections or complications.',
    readTime: 5,
  },
  {
    id: 'dn-3',
    title: 'Essential Vitamins & Minerals',
    category: 'Diet & Nutrition',
    summary: 'Key supplements required for pregnancy health.',
    content:
      'Folic acid, iron, calcium, and vitamin D play vital roles.',
    readTime: 6,
  },
  {
    id: 'dn-8',
    title: 'Support Your Nutrition During Pregnancy (Video)',
    category: 'Diet & Nutrition',
    summary: 'NHS guidance on nutrition and healthy eating during pregnancy.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=QDmBDKoyfKs',
  },
  {
    id: 'dn-9',
    title: 'Healthy Eating With Gestational Diabetes (Video)',
    category: 'Diet & Nutrition',
    summary: 'Nutrition tips for managing gestational diabetes safely.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=GLwZLmCbziQ',
  },

  /* ---------------- Symptoms & Relief ---------------- */
  {
    id: 'sr-1',
    title: 'Managing Morning Sickness',
    category: 'Symptoms & Relief',
    summary: 'Tips and remedies for dealing with nausea.',
    content:
      'Morning sickness is common and usually peaks in the first trimester.',
    readTime: 5,
  },
  {
    id: 'sr-2',
    title: 'Back Pain & Leg Cramps',
    category: 'Symptoms & Relief',
    summary: 'Why these symptoms occur and how to relieve them.',
    content:
      'Postural changes and mineral deficiencies can cause discomfort.',
    readTime: 6,
  },
  {
    id: 'sr-3',
    title: 'Fatigue & Sleep Issues',
    category: 'Symptoms & Relief',
    summary: 'Managing tiredness and improving sleep quality.',
    content:
      'Hormonal changes can significantly impact energy levels.',
    readTime: 6,
  },
  {
    id: 'sr-8',
    title: 'Coping With Morning Sickness (Video)',
    category: 'Symptoms & Relief',
    summary: 'NHS advice on easing nausea and morning sickness.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=tgZ4_7b6cI4',
  },
  {
    id: 'sr-9',
    title: 'What Pregnancy Symptoms Are Normal (Video)',
    category: 'Symptoms & Relief',
    summary: 'An NHS video explaining common pregnancy symptoms.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://www.youtube.com/watchv=LFTAerrHUCs',
  },

  /* ---------------- Fitness ---------------- */
  {
    id: 'ft-1',
    title: 'Safe Exercises During Pregnancy',
    category: 'Fitness',
    summary: 'Recommended physical activities for expectant mothers.',
    content:
      'Regular exercise improves circulation, mood, and endurance.',
    readTime: 6,
  },
  {
    id: 'ft-2',
    title: 'Yoga & Stretching',
    category: 'Fitness',
    summary: 'Gentle yoga poses to stay flexible and relaxed.',
    content:
      'Prenatal yoga helps relieve stress and prepare for labor.',
    readTime: 5,
  },
  {
    id: 'ft-3',
    title: 'Walking & Light Cardio',
    category: 'Fitness',
    summary: 'Simple ways to stay active throughout pregnancy.',
    content:
      'Walking is one of the safest and most effective exercises.',
    readTime: 5,
  },
  {
    id: 'ft-4',
    title: 'Prenatal Fitness Journey (Video 1)',
    category: 'Fitness',
    summary: 'Follow-along fitness session to stay active and healthy.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://youtu.be/fDPHdTAaT4osi=D-A27M7vK7Et1fKE',
  },
  {
    id: 'ft-5',
    title: 'Prenatal Fitness Journey (Video 2)',
    category: 'Fitness',
    summary: 'Gentle workout routine designed for expecting moms.',
    content: 'youtube',
    readTime: 0,
    externalLink: 'https://youtu.be/T0ElRyCPeQosi=c1DXunqBVCWd6GZl',
  },

  /* ---------------- Birth Preparation ---------------- */
  {
    id: 'bp-1',
    title: 'Birth Plan Checklist',
    category: 'Birth Preparation',
    summary: 'Create a birth plan that reflects your preferences.',
    content:
      'A birth plan helps communicate your wishes to healthcare providers.',
    readTime: 6,
  },
  {
    id: 'bp-2',
    title: 'Hospital Bag Essentials',
    category: 'Birth Preparation',
    summary: 'What to pack for labor and delivery.',
    content:
      'Preparing your hospital bag early reduces last-minute stress.',
    readTime: 5,
  },
  {
    id: 'bp-3',
    title: 'Signs of Labor',
    category: 'Birth Preparation',
    summary: 'How to recognize when labor begins.',
    content:
      'Understanding labor signs helps you know when to seek care.',
    readTime: 6,
  },

  /* ---------------- Medical Care ---------------- */
  {
    id: 'mc-1',
    title: 'Prenatal Checkups',
    category: 'Medical Care',
    summary: 'Why regular doctor visits are essential.',
    content:
      'Prenatal visits monitor both maternal and fetal health.',
    readTime: 6,
  },
  {
    id: 'mc-2',
    title: 'Ultrasound & Screening Tests',
    category: 'Medical Care',
    summary: 'Understanding common pregnancy tests.',
    content:
      'Screening tests assess fetal development and potential risks.',
    readTime: 7,
  },
  {
    id: 'mc-3',
    title: 'When to Call the Doctor',
    category: 'Medical Care',
    summary: 'Warning signs that require medical attention.',
    content:
      'Prompt care can prevent complications and ensure safety.',
    readTime: 5,
  },

  /* ---------------- Music & Relaxation ---------------- */
{
  id: 'music-1',
  title: 'Prenatal Relaxation Music',
  category: 'Music & Relaxation',
  summary: 'Calming music to reduce stress and promote relaxation during pregnancy.',
  content: 'spotify',
  readTime: 0,
  externalLink: 'https://open.spotify.com/playlist/24Mdr984YzBFtTWJUzxzcosi=6e4f7f2fcb2e4d3c',
},
{
  id: 'music-2',
  title: 'Baby Bonding Music',
  category: 'Music & Relaxation',
  summary: 'Soft melodies that help mothers bond emotionally with their baby.',
  content: 'spotify',
  readTime: 0,
  externalLink: 'https://open.spotify.com/playlist/2gORKmtRhMY69QA1qtJVKAsi=26b82894c7664fdf',
},
  {
    id: 'music-3',
    title: 'Sleep & Calm Music',
    category: 'Music & Relaxation',
    summary: 'Relaxing music to support better sleep and emotional calm.',
    content: 'spotify',
    readTime: 0,
    externalLink: 'https://open.spotify.com/playlist/6KeVxmlymvSFe2WGnj8WDosi=42b85ea24fef47fb',
  },

  /* ---------------- Official Updates ---------------- */
  {
    id: 'ou-1',
    title: 'WHO: Antenatal Care Recommendations',
    category: 'Official Updates',
    summary: 'WHO guidance recommends a positive pregnancy experience with regular antenatal contacts.',
    content:
      'Official WHO guidance outlines the minimum number of antenatal contacts and emphasizes evidence-based interventions, counselling, and timely ultrasound to improve maternal and newborn outcomes.',
    readTime: 7,
    externalLink: 'https://www.who.int/news/item/07-11-2016-new-guidelines-on-antenatal-care-for-a-positive-pregnancy-experience',
  },
  {
    id: 'ou-2',
    title: 'CDC: Folic Acid Guidance',
    category: 'Official Updates',
    summary: 'CDC recommends daily folic acid to prevent neural tube defects.',
    content:
      'The CDC advises 400 mcg folic acid daily for people who could become pregnant. This helps prevent neural tube defects and is most critical before and early in pregnancy.',
    readTime: 6,
    externalLink: 'https://www.cdc.gov/folic-acid/about/index.html',
  },
  {
    id: 'ou-3',
    title: 'NHS: Your Antenatal Appointments',
    category: 'Official Updates',
    summary: 'NHS explains booking and routine antenatal appointments and what to expect.',
    content:
      'NHS guidance covers the early booking appointment and routine checks such as blood pressure, urine tests, and screening options. It also explains the schedule of appointments through pregnancy.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-appointments/',
  },
  {
    id: 'ou-4',
    title: 'NHS: Baby Movements',
    category: 'Official Updates',
    summary: "Know what's normal for baby movements and when to seek help.",
    content:
      'NHS advice stresses that you should feel baby movements every day later in pregnancy. If movements are reduced or different, contact your midwife or maternity unit immediately.',
    readTime: 5,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
  },


  /* ---------------- Pregnancy Stages (Official Sources) ---------------- */
  {
    id: 'ps-4',
    title: 'First Trimester Booking Appointment',
    category: 'Pregnancy Stages',
    summary: 'The booking appointment happens early in pregnancy and sets your care plan.',
    content:
      'NHS guidance recommends an early booking appointment (ideally before 10 weeks). Your midwife or doctor records health history, checks blood pressure and urine, and explains screening tests and care options.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-appointments/',
  },
  {
    id: 'ps-5',
    title: '11-14 Week Dating Scan',
    category: 'Pregnancy Stages',
    summary: 'An ultrasound between 11 and 14 weeks estimates your due date and checks development.',
    content:
      'The NHS dating scan helps estimate gestational age, checks for multiple pregnancy and can be part of combined screening. It is routinely offered in early pregnancy care.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/conditions/pregnancy-and-baby/ultrasound-anomaly-baby-scans-pregnant/',
  },
  {
    id: 'ps-6',
    title: '18-21 Week Anomaly Scan',
    category: 'Pregnancy Stages',
    summary: "The mid-pregnancy scan checks your baby's growth and looks for physical conditions.",
    content:
      "The NHS 20-week scan (typically 18 to 21 weeks) checks your baby's development and growth, and reviews the placenta. It is a key milestone in second trimester care.",
    readTime: 6,
    externalLink: 'https://www.nhs.uk/conditions/pregnancy-and-baby/ultrasound-anomaly-baby-scans-pregnant/',
  },
  {
    id: 'ps-7',
    title: 'Feeling Baby Movements',
    category: 'Pregnancy Stages',
    summary: 'Most people feel movements between 16 and 24 weeks and should monitor changes.',
    content:
      'NHS guidance says you should feel movements every day later in pregnancy and right up to labour. If movements are reduced or different, contact your midwife or maternity unit straight away.',
    readTime: 5,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/',
  },

  /* ---------------- Diet & Nutrition (Official Sources) ---------------- */
  {
    id: 'dn-4',
    title: 'Daily Iron and Folic Acid',
    category: 'Diet & Nutrition',
    summary: 'WHO recommends daily iron and folic acid to reduce anaemia and low birth weight.',
    content:
      'WHO recommends daily iron (30 to 60 mg) plus folic acid (400 mcg) during pregnancy, starting as early as possible. This supports maternal health and helps reduce anaemia and low birth weight risks.',
    readTime: 6,
    externalLink: 'https://www.who.int/data/nutrition/nlis/info/antenatal-iron-supplementation',
  },
  {
    id: 'dn-5',
    title: 'Folic Acid 400 mcg Daily',
    category: 'Diet & Nutrition',
    summary: 'CDC recommends 400 mcg of folic acid daily to prevent neural tube defects.',
    content:
      'The CDC advises 400 mcg of folic acid daily for people who could become pregnant. This lowers the risk of neural tube defects and is most important before conception and in early pregnancy.',
    readTime: 5,
    externalLink: 'https://www.cdc.gov/folic-acid/about/index.html',
  },
  {
    id: 'dn-6',
    title: 'Pregnancy Vitamins and Vitamin D',
    category: 'Diet & Nutrition',
    summary: 'NHS guidance includes folic acid, vitamin D, and avoiding vitamin A supplements.',
    content:
      'NHS guidance recommends 400 mcg folic acid until 12 weeks and a daily vitamin D supplement (10 mcg). Avoid vitamin A supplements and ask your clinician if you need a higher folic acid dose.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/',
  },
  {
    id: 'dn-7',
    title: 'Foods to Avoid and Caffeine Limit',
    category: 'Diet & Nutrition',
    summary: 'Limit caffeine to 200 mg per day and avoid high-risk foods.',
    content:
      'NHS advice includes limiting caffeine to 200 mg a day and avoiding raw shellfish. It also recommends limiting tuna and oily fish because of mercury and pollutants.',
    readTime: 5,
    externalLink: 'https://111.wales.nhs.uk/doityourself/pregnancy/FoodstoAvoidHW/',
  },

  /* ---------------- Symptoms & Relief (Official Sources) ---------------- */
  {
    id: 'sr-4',
    title: 'Morning Sickness Basics',
    category: 'Symptoms & Relief',
    summary: 'Nausea and vomiting are common in early pregnancy and usually improve by mid-pregnancy.',
    content:
      'NHS guidance notes that morning sickness can happen any time of day and often improves by weeks 16 to 20. Small, frequent meals and rest can help, and you should seek help if you cannot keep fluids down.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/common-symptoms/vomiting-and-morning-sickness/',
  },
  {
    id: 'sr-5',
    title: 'Severe Vomiting (Hyperemesis)',
    category: 'Symptoms & Relief',
    summary: 'Severe vomiting can cause dehydration and may need hospital treatment.',
    content:
      'NHS guidance says excessive nausea and vomiting (hyperemesis gravidarum) can lead to dehydration and needs medical care. Contact your midwife or doctor if you cannot keep food or drink down.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/related-conditions/complications/severe-vomiting/',
  },
  {
    id: 'sr-6',
    title: 'Back Pain Relief',
    category: 'Symptoms & Relief',
    summary: 'Back pain is common as ligaments soften; posture and gentle movement help.',
    content:
      'NHS advice includes avoiding heavy lifting, keeping your back supported, and using gentle exercises. Talk to your midwife or GP if pain is severe or you have other symptoms.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/common-symptoms/back-pain/',
  },
  {
    id: 'sr-7',
    title: 'Indigestion and Heartburn',
    category: 'Symptoms & Relief',
    summary: 'Heartburn is common; small meals and avoiding late eating can help.',
    content:
      'NHS guidance recommends smaller, more frequent meals and avoiding eating within 3 hours of bedtime. Reducing caffeine and fatty foods can help, and safe medicines are available if needed.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/',
  },

  /* ---------------- Fitness (Official Sources) ---------------- */
  {
    id: 'ft-6',
    title: 'Stay Active Safely',
    category: 'Fitness',
    summary: 'NHS guidance says exercise is safe for most pregnancies and helps with labour.',
    content:
      'The NHS notes that staying active helps you adapt to pregnancy changes and can make labour easier. Keep up normal activity as comfortable and avoid exhausting yourself.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
  },
  {
    id: 'ft-7',
    title: 'Daily Movement Matters',
    category: 'Fitness',
    summary: 'Even 30 minutes of walking daily can be enough, and any amount helps.',
    content:
      'NHS exercise tips suggest staying active daily. Walking for around 30 minutes can be enough, and if you cannot manage that, any amount of movement is better than none.',
    readTime: 5,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
  },
  {
    id: 'ft-8',
    title: 'Exercises to Avoid',
    category: 'Fitness',
    summary: 'Avoid lying flat after 16 weeks and contact sports with risk of impact.',
    content:
      'NHS guidance advises avoiding prolonged lying flat on your back after 16 weeks, contact sports, scuba diving and high altitude exercise. These reduce risks to you and your baby.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
  },
  {
    id: 'ft-9',
    title: 'Pelvic Floor Exercises',
    category: 'Fitness',
    summary: 'Strengthening pelvic floor muscles helps reduce stress incontinence.',
    content:
      'NHS guidance recommends pelvic floor exercises for all pregnant women. Regular sets of squeezes strengthen support muscles and reduce leakage when coughing or sneezing.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
  },

  /* ---------------- Birth Preparation (Official Sources) ---------------- */
  {
    id: 'bp-4',
    title: 'Create a Birth Plan',
    category: 'Birth Preparation',
    summary: 'A birth plan records your preferences and can be updated any time.',
    content:
      'NHS guidance says a birth plan helps you understand options and discuss them with your midwife. It can include pain relief, who is present, and care after birth, and can change as needed.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/how-to-make-a-birth-plan/',
  },
  {
    id: 'bp-5',
    title: 'Signs Labour Is Starting',
    category: 'Birth Preparation',
    summary: 'Know warning signs such as waters breaking, bleeding, or reduced movements.',
    content:
      'NHS advice says to call your midwife or maternity unit urgently if your waters break, you have bleeding, or baby movements are reduced. Contraction patterns and a mucus show can signal labour.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/start-for-life/pregnancy/preparing-for-labour-and-birth/signs-of-going-into-labour/',
  },
  {
    id: 'bp-6',
    title: 'Pack Your Bag for Labour',
    category: 'Birth Preparation',
    summary: 'Pack essentials a few weeks before your due date for you and your baby.',
    content:
      'NHS guidance recommends packing items like your notes, loose clothing, pads, toiletries, snacks, and baby clothes. Have a plan even if you expect a home birth.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/pack-your-bag-for-labour/',
  },
  {
    id: 'bp-7',
    title: 'Stages of Labour and Birth',
    category: 'Birth Preparation',
    summary: 'Labour progresses through latent, active and third stages after birth.',
    content:
      'NHS guidance describes latent and established labour, followed by delivery of the placenta. Staying upright, breathing, and regular checks help you cope during the stages.',
    readTime: 7,
    externalLink: 'https://www.nhs.uk/pregnancy/labour-and-birth/what-happens/the-stages-of-labour-and-birth/',
  },

  /* ---------------- Medical Care (Official Sources) ---------------- */
  {
    id: 'mc-4',
    title: 'Antenatal Care and Screening',
    category: 'Medical Care',
    summary: 'NHS antenatal care includes scans, screening tests, and infection blood tests.',
    content:
      'NHS antenatal care offers ultrasound scans, screening for conditions, and blood tests for infections such as HIV, hepatitis B and syphilis. Early booking ensures you get the right tests at the right time.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-care/',
  },
  {
    id: 'mc-5',
    title: 'WHO Antenatal Contacts',
    category: 'Medical Care',
    summary: 'WHO recommends at least 8 antenatal contacts for a positive pregnancy experience.',
    content:
      'WHO guidelines recommend a minimum of 8 contacts, counselling on healthy eating and activity, and an ultrasound before 24 weeks. These steps improve care and outcomes for mother and baby.',
    readTime: 7,
    externalLink: 'https://www.who.int/news/item/07-11-2016-new-guidelines-on-antenatal-care-for-a-positive-pregnancy-experience',
  },
  {
    id: 'mc-6',
    title: 'Tetanus Vaccination',
    category: 'Medical Care',
    summary: 'WHO recommends tetanus toxoid vaccination during pregnancy when indicated.',
    content:
      'WHO guidance includes tetanus toxoid vaccination depending on previous exposure. It helps prevent neonatal tetanus and is part of routine antenatal care in many settings.',
    readTime: 6,
    externalLink: 'https://www.who.int/news/item/07-11-2016-new-guidelines-on-antenatal-care-for-a-positive-pregnancy-experience',
  },
  {
    id: 'mc-7',
    title: 'Ultrasound Scans and Timing',
    category: 'Medical Care',
    summary: 'NHS care offers at least 2 scans: 11-14 weeks and 18-21 weeks.',
    content:
      'NHS guidance explains the dating scan at 11 to 14 weeks and the anomaly scan at 18 to 21 weeks. Scans estimate due date, check growth, and screen for conditions.',
    readTime: 6,
    externalLink: 'https://www.nhs.uk/conditions/pregnancy-and-baby/ultrasound-anomaly-baby-scans-pregnant/',
  },

];


export const mockGuideItems: GuideItem[] = [
  {
    id: 'guide-001',
    title: 'Folic Acid Intake',
    category: 'diet',
    content: 'Take 400-800 mcg of folic acid daily to prevent birth defects.',
    icon: 'pill',
  },
  {
    id: 'guide-002',
    title: 'Stay Hydrated',
    category: 'diet',
    content: 'Drink at least 8-10 glasses of water daily.',
    icon: 'droplet',
  },
  {
    id: 'guide-003',
    title: 'Gentle Walking',
    category: 'exercise',
    content: '30 minutes of walking daily helps maintain fitness.',
    icon: 'footprints',
  },
  {
    id: 'guide-004',
    title: 'Prenatal Vitamins',
    category: 'dos',
    content: 'Take your prenatal vitamins as prescribed.',
    icon: 'check-circle',
  },
  {
    id: 'guide-005',
    title: 'Avoid Raw Fish',
    category: 'donts',
    content: 'Raw fish may contain harmful bacteria and parasites.',
    icon: 'x-circle',
  },
  {
    id: 'guide-006',
    title: 'Limit Caffeine',
    category: 'donts',
    content: 'Keep caffeine intake under 200mg per day.',
    icon: 'coffee',
  },
  {
    id: 'guide-007',
    title: 'Get Adequate Sleep',
    category: 'wellness',
    content: 'Aim for 7-9 hours of quality sleep each night.',
    icon: 'moon',
  },
  {
    id: 'guide-008',
    title: 'Attend All Check-ups',
    category: 'dos',
    content: 'Regular prenatal visits are essential for monitoring.',
    icon: 'calendar-check',
  },
];


export const mockMessages: Message[] = [
  {
    id: 'msg-001',
    content: 'Hello! I have a question about my recent symptoms.',
    senderId: 'pat-001',
    senderType: 'user',
    timestamp: new Date('2024-12-23T10:30:00'),
  },
  {
    id: 'msg-002',
    content: 'Of course! I\'m here to help. What symptoms are you experiencing',
    senderId: 'ai',
    senderType: 'ai',
    timestamp: new Date('2024-12-23T10:30:30'),
    isAI: true,
  },
  {
    id: 'msg-003',
    content: 'I\'ve been feeling more tired than usual this week.',
    senderId: 'pat-001',
    senderType: 'user',
    timestamp: new Date('2024-12-23T10:31:00'),
  },
  {
    id: 'msg-004',
    content: 'Fatigue is very common during pregnancy, especially in the first and third trimesters. Your body is working hard to support your growing baby. Make sure you\'re getting enough rest, staying hydrated, and eating iron-rich foods. If the fatigue is severe or accompanied by other symptoms, please consult with your doctor.',
    senderId: 'ai',
    senderType: 'ai',
    timestamp: new Date('2024-12-23T10:31:30'),
    isAI: true,
  },
];

export const mockHealthData: HealthEntry[] = [
  { date: new Date('2024-12-01'), weight: 65.2, mood: 'good' },
  { date: new Date('2024-12-08'), weight: 65.8, mood: 'great' },
  { date: new Date('2024-12-15'), weight: 66.3, mood: 'good' },
  { date: new Date('2024-12-22'), weight: 66.9, mood: 'okay' },
];

export const getBabyDevelopment = (week: number): string => {
  const developments: Record<number, string> = {
    24: 'Your baby is about the size of an ear of corn. They can now hear sounds from the outside world and may respond to your voice.',
    18: 'Your baby is about the size of a sweet potato. They are developing unique fingerprints and can yawn and hiccup.',
    22: 'Your baby is about the size of a papaya. Their eyes are formed but the irises still lack pigment.',
    28: 'Your baby is about the size of an eggplant. They can open and close their eyes and have regular sleep cycles.',
    34: 'Your baby is about the size of a cantaloupe. Most of their basic physical development is complete.',
  };
  return developments[week] || 'Your baby continues to grow and develop every day.';
};
