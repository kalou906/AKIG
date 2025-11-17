/**
 * Local Languages Configuration for AKIG (Guinea & West Africa)
 * 
 * Support pour langues locales africaines:
 * - Soussou (ss) - 1.8M speakers in Guinea
 * - Peulh/Fula (ff) - 8M speakers across West Africa
 * - Malinké/Maninka (kg) - 10M speakers (Mali, Guinea, Senegal)
 * - Kissi (kss) - 150k speakers (Guinea, Liberia)
 * 
 * Intégration: react-i18next v16.2.0 + langue detection automatique
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traductions locales - format clé/valeur structuré
const resources = {
  // SOUSSOU (Soussou - Senegambian language)
  ss: {
    translation: {
      // Navigation
      'nav.dashboard': 'Kundo',
      'nav.contracts': 'Kuntolu Kunama',
      'nav.payments': 'Masa',
      'nav.notices': 'Kintalo',
      'nav.tenants': 'Kunama',
      'nav.settings': 'Adirisa',
      'nav.help': 'Koosa',

      // Common
      'common.save': 'Kande',
      'common.cancel': 'Kutali',
      'common.delete': 'Kutele',
      'common.edit': 'Korente',
      'common.yes': 'I',
      'common.no': 'Ine',
      'common.loading': 'Kunintako...',
      'common.error': 'Koosi kana',
      'common.success': 'Ka yina nde',

      // Contract Management
      'contracts.new_contract': 'Kuntolu koori',
      'contracts.contract_id': 'Kuntolu ID',
      'contracts.property': 'Liyaya',
      'contracts.tenant': 'Kunama',
      'contracts.rent': 'Masa Kuntolu',
      'contracts.start_date': 'Kuntolu kunta',
      'contracts.end_date': 'Kuntolu Mandi',
      'contracts.deposit': 'Kande Sukuliyya',
      'contracts.terms': 'Kuntolu Aliyya',
      'contracts.status': 'Kuntolu Haala',
      'contracts.active': 'Kunantako',
      'contracts.completed': 'Ka yina',
      'contracts.terminated': 'Ka sali',

      // Payment Management
      'payments.payment': 'Masa',
      'payments.amount': 'Masa Namba',
      'payments.date_paid': 'Masa Kunta',
      'payments.due_date': 'Masa Suluba Kunta',
      'payments.status': 'Masa Haala',
      'payments.paid': 'Ka yina masa',
      'payments.pending': 'Kunintako',
      'payments.overdue': 'Ka sulube',
      'payments.method': 'Masa Linyi',
      'payments.cash': 'Sani',
      'payments.bank_transfer': 'Banki Sansi',
      'payments.mobile_money': 'Tele Sani',

      // Notices
      'notices.notice': 'Kintalo',
      'notices.type': 'Kintalo Linyi',
      'notices.eviction': 'Kunama Taliya',
      'notices.repairs': 'Liyaya Korentiya',
      'notices.lease_renewal': 'Kuntolu Sunutu',
      'notices.date_issued': 'Kintalo kunta',
      'notices.status': 'Kintalo Haala',
      'notices.sent': 'Ka tuma',
      'notices.acknowledged': 'Ka yindi',
      'notices.signed': 'Ka sia',

      // Tenant Management
      'tenants.name': 'Kunama Tiya',
      'tenants.phone': 'Telefu',
      'tenants.email': 'Email',
      'tenants.address': 'Liyaya Tiya',
      'tenants.id_card': 'ID Kaarta',
      'tenants.rental_history': 'Kunama Tarixu',
      'tenants.contact': 'Kunama Tamasi',
      'tenants.status': 'Kunama Haala',
      'tenants.active': 'Kunantako',
      'tenants.inactive': 'Kunaintako Ine',

      // Litigations
      'litigation.dispute': 'Koosi',
      'litigation.type': 'Koosi Linyi',
      'litigation.maintenance': 'Liyaya Fentale',
      'litigation.damage': 'Liyaya Tumanke',
      'litigation.payment': 'Masa Koosi',
      'litigation.status': 'Koosi Haala',
      'litigation.filed': 'Ka karinke',
      'litigation.in_progress': 'Kunintako',
      'litigation.resolved': 'Ka sali koosi',
      'litigation.description': 'Koosi Kalkali',
      'litigation.evidence': 'Koosi Firkatiya',

      // Dashboard
      'dashboard.summary': 'Kundo Liliyya',
      'dashboard.total_tenants': 'Kunama Namba',
      'dashboard.occupied_properties': 'Liyaya Kunama Kaye',
      'dashboard.vacant': 'Liyaya Tonkoy',
      'dashboard.total_rent': 'Masa Namba',
      'dashboard.collected': 'Masa Ka nata',
      'dashboard.pending': 'Masa Kunintako',
      'dashboard.overdue_payments': 'Masa Ka sulube',
      'dashboard.active_disputes': 'Koosi Kunantako',

      // Messages
      'messages.message': 'Talusun',
      'messages.new_message': 'Talusun Koori',
      'messages.subject': 'Talusun Sura',
      'messages.body': 'Talusun Kalippa',
      'messages.from': 'Talusun Tamsi Gara',
      'messages.to': 'Talusun Tamsi Ge',
      'messages.date': 'Talusun Kunta',
      'messages.reply': 'Talusun Koresi',
      'messages.archive': 'Talusun Kunintako',

      // Alerts
      'alerts.payment_due': 'Masa suluba kunta',
      'alerts.payment_overdue': 'Masa ka sulube',
      'alerts.notice_pending': 'Kintalo kunintako',
      'alerts.dispute_filed': 'Koosi karinke',
      'alerts.property_issue': 'Liyaya Koosi',
      'alerts.high_priority': 'Sura Koosi',
      'alerts.medium_priority': 'Sura Tilintali',
      'alerts.low_priority': 'Sura Konin',

      // Reports
      'reports.report': 'Alifu',
      'reports.generated': 'Alifu Koori',
      'reports.date_range': 'Kunta Firiya',
      'reports.export': 'Alifu Tuma',
      'reports.pdf': 'PDF',
      'reports.excel': 'Sanu Alifu',
      'reports.download': 'Alifu Yala',

      // Settings
      'settings.profile': 'Adirisa Tiya',
      'settings.language': 'Kun Tiya',
      'settings.notifications': 'Taluki',
      'settings.security': 'Sanifya',
      'settings.password': 'Sanifu Kode',
      'settings.two_factor': 'Sanifu Filiba',
      'settings.logout': 'Ka Kuli',
    },
  },

  // PEULH (Fulani/Fula - widely spoken across West Africa)
  ff: {
    translation: {
      // Navigation
      'nav.dashboard': 'Njuujaaru',
      'nav.contracts': 'Debere',
      'nav.payments': 'Jambugol',
      'nav.notices': 'Yoosugol',
      'nav.tenants': 'Jooguuji',
      'nav.settings': 'Teereegol',
      'nav.help': 'Jammagol',

      // Common
      'common.save': 'Danndu',
      'common.cancel': 'Faca',
      'common.delete': 'Gujje',
      'common.edit': 'Taggel',
      'common.yes': 'Eey',
      'common.no': 'Alaa',
      'common.loading': 'A jammagol...',
      'common.error': 'Palal',
      'common.success': 'Jam seeni ko',

      // Contract Management
      'contracts.new_contract': 'Debere Hesere',
      'contracts.contract_id': 'Debere ID',
      'contracts.property': 'Ruumol',
      'contracts.tenant': 'Joogalle',
      'contracts.rent': 'Jambugol Debere',
      'contracts.start_date': 'Debere Lootol',
      'contracts.end_date': 'Debere Kootirgol',
      'contracts.deposit': 'Kayda',
      'contracts.terms': 'Debere Sharti',
      'contracts.status': 'Debere Haali',
      'contracts.active': 'Aktiwol',
      'contracts.completed': 'Faajinaa',
      'contracts.terminated': 'Faccaa',

      // Payment Management
      'payments.payment': 'Jambugol',
      'payments.amount': 'Jambugol Limma',
      'payments.date_paid': 'Jambugol Lootol',
      'payments.due_date': 'Jambugol Akti',
      'payments.status': 'Jambugol Haali',
      'payments.paid': 'Jam seeni',
      'payments.pending': 'A jammagol',
      'payments.overdue': 'A hawti',
      'payments.method': 'Jambugol Yolli',
      'payments.cash': 'Loabi',
      'payments.bank_transfer': 'Banki Jokkude',
      'payments.mobile_money': 'Telefon Jambugol',

      // Notices
      'notices.notice': 'Yoosugol',
      'notices.type': 'Yoosugol Yolli',
      'notices.eviction': 'Joogalle Yaayde',
      'notices.repairs': 'Ruumol Taggel',
      'notices.lease_renewal': 'Debere Hesere',
      'notices.date_issued': 'Yoosugol Lootol',
      'notices.status': 'Yoosugol Haali',
      'notices.sent': 'A yoosii',
      'notices.acknowledged': 'A yaakuude',
      'notices.signed': 'A sahijje',

      // Tenant Management
      'tenants.name': 'Joogalle Innde',
      'tenants.phone': 'Telefon',
      'tenants.email': 'Email',
      'tenants.address': 'Ruumol Nooni',
      'tenants.id_card': 'ID Kaarti',
      'tenants.rental_history': 'Debere Taariika',
      'tenants.contact': 'Joogalle Hokku',
      'tenants.status': 'Joogalle Haali',
      'tenants.active': 'Aktiwol',
      'tenants.inactive': 'A aktiwol',

      // Litigations
      'litigation.dispute': 'Palal',
      'litigation.type': 'Palal Yolli',
      'litigation.maintenance': 'Ruumol Jam',
      'litigation.damage': 'Ruumol Gujje',
      'litigation.payment': 'Jambugol Palal',
      'litigation.status': 'Palal Haali',
      'litigation.filed': 'A yoosii',
      'litigation.in_progress': 'A jammagol',
      'litigation.resolved': 'Palal Faajinaa',
      'litigation.description': 'Palal Geese',
      'litigation.evidence': 'Palal Caggol',

      // Dashboard
      'dashboard.summary': 'Njuujaaru Yiggol',
      'dashboard.total_tenants': 'Joogalle Limma',
      'dashboard.occupied_properties': 'Ruumol Joogalle Kay',
      'dashboard.vacant': 'Ruumol Moodi',
      'dashboard.total_rent': 'Jambugol Limma',
      'dashboard.collected': 'Jambugol Kay',
      'dashboard.pending': 'Jambugol A jammagol',
      'dashboard.overdue_payments': 'Jambugol A hawti',
      'dashboard.active_disputes': 'Palal Aktiwol',

      // Messages
      'messages.message': 'Jawtere',
      'messages.new_message': 'Jawtere Hesere',
      'messages.subject': 'Jawtere Sura',
      'messages.body': 'Jawtere Innde',
      'messages.from': 'Jawtere Doole',
      'messages.to': 'Jawtere Maa',
      'messages.date': 'Jawtere Lootol',
      'messages.reply': 'Jawtere Faaminde',
      'messages.archive': 'Jawtere Kayda',

      // Alerts
      'alerts.payment_due': 'Jambugol akti',
      'alerts.payment_overdue': 'Jambugol a hawti',
      'alerts.notice_pending': 'Yoosugol a jammagol',
      'alerts.dispute_filed': 'Palal yoosii',
      'alerts.property_issue': 'Ruumol palal',
      'alerts.high_priority': 'Sura Kaala',
      'alerts.medium_priority': 'Sura Tilintali',
      'alerts.low_priority': 'Sura Konin',

      // Reports
      'reports.report': 'Raapoo',
      'reports.generated': 'Raapoo Heseraa',
      'reports.date_range': 'Lootol Firiya',
      'reports.export': 'Raapoo Yaaside',
      'reports.pdf': 'PDF',
      'reports.excel': 'Sabel Raapoo',
      'reports.download': 'Raapoo Momta',

      // Settings
      'settings.profile': 'Jeegol Innde',
      'settings.language': 'Kun Yolli',
      'settings.notifications': 'Wobugol',
      'settings.security': 'Jokkaade',
      'settings.password': 'Jokkaade Kode',
      'settings.two_factor': 'Jokkaade Filiba',
      'settings.logout': 'A jokku',
    },
  },

  // MALINKÉ (Maninka - Mali, Guinea, Senegal)
  kg: {
    translation: {
      // Navigation
      'nav.dashboard': 'Jàntèngèli',
      'nav.contracts': 'Jìrèli',
      'nav.payments': 'Dìnàli',
      'nav.notices': 'Kàfòni',
      'nav.tenants': 'Dúnúnìli',
      'nav.settings': 'Tòkoli',
      'nav.help': 'Tòkoli Jàntè',

      // Common
      'common.save': 'Sìgi',
      'common.cancel': 'Kàyo',
      'common.delete': 'Sìle',
      'common.edit': 'Sabari',
      'common.yes': 'Yoo',
      'common.no': 'Nya',
      'common.loading': 'Ànaka le...',
      'common.error': 'Bòli',
      'common.success': 'Ka yina ma',

      // Contract Management
      'contracts.new_contract': 'Jìrè Kooro',
      'contracts.contract_id': 'Jìrè ID',
      'contracts.property': 'Sogoní',
      'contracts.tenant': 'Dúnúnì',
      'contracts.rent': 'Dìnà Jìrè',
      'contracts.start_date': 'Jìrè Kaara',
      'contracts.end_date': 'Jìrè Kònò',
      'contracts.deposit': 'Nìn Sógó',
      'contracts.terms': 'Jìrè Jalan',
      'contracts.status': 'Jìrè Haali',
      'contracts.active': 'Ka ìsan',
      'contracts.completed': 'Ka dàmmìn',
      'contracts.terminated': 'Ka kanò',

      // Payment Management
      'payments.payment': 'Dìnà',
      'payments.amount': 'Dìnà Kònòngò',
      'payments.date_paid': 'Dìnà Kaara',
      'payments.due_date': 'Dìnà Kònò',
      'payments.status': 'Dìnà Haali',
      'payments.paid': 'Ka sòrò',
      'payments.pending': 'Ànaka le',
      'payments.overdue': 'Ka kala',
      'payments.method': 'Dìnà Jala',
      'payments.cash': 'Sàní',
      'payments.bank_transfer': 'Banki Yee',
      'payments.mobile_money': 'Tele Sàní',

      // Notices
      'notices.notice': 'Kàfòni',
      'notices.type': 'Kàfòni Jala',
      'notices.eviction': 'Dúnúnì Tòggò',
      'notices.repairs': 'Sogoní Kumasogò',
      'notices.lease_renewal': 'Jìrè Kooro',
      'notices.date_issued': 'Kàfòni Kaara',
      'notices.status': 'Kàfòni Haali',
      'notices.sent': 'Ka yee',
      'notices.acknowledged': 'Ka nimina',
      'notices.signed': 'Ka sígi',

      // Tenant Management
      'tenants.name': 'Dúnúnì Tìyó',
      'tenants.phone': 'Telefu',
      'tenants.email': 'Email',
      'tenants.address': 'Sogoní Tìyó',
      'tenants.id_card': 'ID Kaadi',
      'tenants.rental_history': 'Dúnúnì Tàrinà',
      'tenants.contact': 'Dúnúnì Tamasi',
      'tenants.status': 'Dúnúnì Haali',
      'tenants.active': 'Ka ìsan',
      'tenants.inactive': 'Kànya ìsan',

      // Litigations
      'litigation.dispute': 'Bòli',
      'litigation.type': 'Bòli Jala',
      'litigation.maintenance': 'Sogoní Tòngò',
      'litigation.damage': 'Sogoní Sile',
      'litigation.payment': 'Dìnà Bòli',
      'litigation.status': 'Bòli Haali',
      'litigation.filed': 'Ka tèke',
      'litigation.in_progress': 'Ànaka le',
      'litigation.resolved': 'Ka tèle',
      'litigation.description': 'Bòli Sèbè',
      'litigation.evidence': 'Bòli Jàmù',

      // Dashboard
      'dashboard.summary': 'Jàntèngèli Bógò',
      'dashboard.total_tenants': 'Dúnúnì Kònòngò',
      'dashboard.occupied_properties': 'Sogoní Dúnúnì Kó',
      'dashboard.vacant': 'Sogoní Tòmmò',
      'dashboard.total_rent': 'Dìnà Kònòngò',
      'dashboard.collected': 'Dìnà Ka kòli',
      'dashboard.pending': 'Dìnà Ànaka',
      'dashboard.overdue_payments': 'Dìnà Ka kala',
      'dashboard.active_disputes': 'Bòli Ka ìsan',

      // Messages
      'messages.message': 'Kafen',
      'messages.new_message': 'Kafen Kooro',
      'messages.subject': 'Kafen Sura',
      'messages.body': 'Kafen Bógò',
      'messages.from': 'Kafen Tógó',
      'messages.to': 'Kafen Kà',
      'messages.date': 'Kafen Kaara',
      'messages.reply': 'Kafen Jaabi',
      'messages.archive': 'Kafen Kànyo',

      // Alerts
      'alerts.payment_due': 'Dìnà kònò',
      'alerts.payment_overdue': 'Dìnà ka kala',
      'alerts.notice_pending': 'Kàfòni ànaka',
      'alerts.dispute_filed': 'Bòli tèke',
      'alerts.property_issue': 'Sogoní bòli',
      'alerts.high_priority': 'Sèbè Kaala',
      'alerts.medium_priority': 'Sèbè Tilintali',
      'alerts.low_priority': 'Sèbè Konin',

      // Reports
      'reports.report': 'Jàmù',
      'reports.generated': 'Jàmù Kooro',
      'reports.date_range': 'Kaara Firiya',
      'reports.export': 'Jàmù Yee',
      'reports.pdf': 'PDF',
      'reports.excel': 'Sanel Jàmù',
      'reports.download': 'Jàmù Yala',

      // Settings
      'settings.profile': 'Tòkoli Tìyó',
      'settings.language': 'Kan Jala',
      'settings.notifications': 'Kàfòni Sènè',
      'settings.security': 'Sira Fola',
      'settings.password': 'Sira Kode',
      'settings.two_factor': 'Sira Filiba',
      'settings.logout': 'Ka kònò',
    },
  },

  // KISSI (Kissi - Guinea, Liberia)
  kss: {
    translation: {
      // Navigation
      'nav.dashboard': 'Kìnyìnyí',
      'nav.contracts': 'Kínká',
      'nav.payments': 'Yínì',
      'nav.notices': 'Kàsàn',
      'nav.tenants': 'Yendí',
      'nav.settings': 'Kàkúlú',
      'nav.help': 'Kàkúlú Nkáí',

      // Common
      'common.save': 'Kòlí',
      'common.cancel': 'Kúsí',
      'common.delete': 'Kúlí',
      'common.edit': 'Kúsúní',
      'common.yes': 'Yéé',
      'common.no': 'Nyáná',
      'common.loading': 'Kúsúníngò...',
      'common.error': 'Kúbí',
      'common.success': 'Kúbí dòò',

      // Contract Management
      'contracts.new_contract': 'Kínká Múlú',
      'contracts.contract_id': 'Kínká ID',
      'contracts.property': 'Kúlú',
      'contracts.tenant': 'Yendí',
      'contracts.rent': 'Yínì Kínká',
      'contracts.start_date': 'Kínká Nyènga',
      'contracts.end_date': 'Kínká Búkì',
      'contracts.deposit': 'Kúbí Kóò',
      'contracts.terms': 'Kínká Yála',
      'contracts.status': 'Kínká Háálí',
      'contracts.active': 'Kúsúní',
      'contracts.completed': 'Kúsúní dòò',
      'contracts.terminated': 'Kúbí dòò',

      // Payment Management
      'payments.payment': 'Yínì',
      'payments.amount': 'Yínì Kóò',
      'payments.date_paid': 'Yínì Nyènga',
      'payments.due_date': 'Yínì Búkì',
      'payments.status': 'Yínì Háálí',
      'payments.paid': 'Kúbí yínì',
      'payments.pending': 'Kúsúníngò',
      'payments.overdue': 'Ka tóó',
      'payments.method': 'Yínì Yála',
      'payments.cash': 'Yínì Nyáá',
      'payments.bank_transfer': 'Bánkí Yíníngò',
      'payments.mobile_money': 'Tèlèfúní Yínì',

      // Notices
      'notices.notice': 'Kàsàn',
      'notices.type': 'Kàsàn Yála',
      'notices.eviction': 'Yendí Búkì',
      'notices.repairs': 'Kúlú Kúsúní',
      'notices.lease_renewal': 'Kínká Múlú',
      'notices.date_issued': 'Kàsàn Nyènga',
      'notices.status': 'Kàsàn Háálí',
      'notices.sent': 'Ka tígí',
      'notices.acknowledged': 'Ka nímì',
      'notices.signed': 'Ka síìyí',

      // Tenant Management
      'tenants.name': 'Yendí Nèè',
      'tenants.phone': 'Tèlèfúní',
      'tenants.email': 'Email',
      'tenants.address': 'Kúlú Nèè',
      'tenants.id_card': 'ID Kàá',
      'tenants.rental_history': 'Yendí Táríìkú',
      'tenants.contact': 'Yendí Túmásí',
      'tenants.status': 'Yendí Háálí',
      'tenants.active': 'Kúsúní',
      'tenants.inactive': 'Kànýà kúsúní',

      // Litigations
      'litigation.dispute': 'Kúbí',
      'litigation.type': 'Kúbí Yála',
      'litigation.maintenance': 'Kúlú Kàà',
      'litigation.damage': 'Kúlú Kúlí',
      'litigation.payment': 'Yínì Kúbí',
      'litigation.status': 'Kúbí Háálí',
      'litigation.filed': 'Ka kìtí',
      'litigation.in_progress': 'Kúsúníngò',
      'litigation.resolved': 'Kúbí búkì',
      'litigation.description': 'Kúbí Sèbè',
      'litigation.evidence': 'Kúbí Túmásí',

      // Dashboard
      'dashboard.summary': 'Kìnyìnyí Búlú',
      'dashboard.total_tenants': 'Yendí Kóò',
      'dashboard.occupied_properties': 'Kúlú Yendí Kóò',
      'dashboard.vacant': 'Kúlú Búmú',
      'dashboard.total_rent': 'Yínì Kóò',
      'dashboard.collected': 'Yínì Ka kúbí',
      'dashboard.pending': 'Yínì Kúsúníngò',
      'dashboard.overdue_payments': 'Yínì Ka tóó',
      'dashboard.active_disputes': 'Kúbí Kúsúní',

      // Messages
      'messages.message': 'Múnídì',
      'messages.new_message': 'Múnídì Múlú',
      'messages.subject': 'Múnídì Súrú',
      'messages.body': 'Múnídì Búlú',
      'messages.from': 'Múnídì Tógó',
      'messages.to': 'Múnídì Kà',
      'messages.date': 'Múnídì Nyènga',
      'messages.reply': 'Múnídì Yaabí',
      'messages.archive': 'Múnídì Búkì',

      // Alerts
      'alerts.payment_due': 'Yínì búkì',
      'alerts.payment_overdue': 'Yínì ka tóó',
      'alerts.notice_pending': 'Kàsàn kúsúníngò',
      'alerts.dispute_filed': 'Kúbí kìtí',
      'alerts.property_issue': 'Kúlú kúbí',
      'alerts.high_priority': 'Súrú Kaálá',
      'alerts.medium_priority': 'Súrú Tilìntálí',
      'alerts.low_priority': 'Súrú Kònín',

      // Reports
      'reports.report': 'Rápù',
      'reports.generated': 'Rápù Múlú',
      'reports.date_range': 'Nyènga Fírìyá',
      'reports.export': 'Rápù Yíníngò',
      'reports.pdf': 'PDF',
      'reports.excel': 'Sìbíl Rápù',
      'reports.download': 'Rápù Yálá',

      // Settings
      'settings.profile': 'Kàkúlú Nèè',
      'settings.language': 'Kan Yála',
      'settings.notifications': 'Kàsàn Síkí',
      'settings.security': 'Síríì Fúlú',
      'settings.password': 'Síríì Kóódí',
      'settings.two_factor': 'Síríì Fìlìbá',
      'settings.logout': 'Ka búkì',
    },
  },
};

// Initialiser i18n avec support multilingue
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Si langue détectée non supportée
    supportedLngs: ['en', 'fr', 'ss', 'ff', 'kg', 'kss'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

/**
 * Notes d'implémentation:
 * 
 * 1. Placer ce fichier dans: frontend/src/i18n/local-languages.ts
 * 
 * 2. Importer dans App.tsx ou index.tsx:
 *    import './i18n/local-languages';
 * 
 * 3. Utiliser dans composants:
 *    import { useTranslation } from 'react-i18next';
 *    
 *    function Component() {
 *      const { t, i18n } = useTranslation();
 *      
 *      return (
 *        <>
 *          <h1>{t('nav.dashboard')}</h1>
 *          <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
 *            <option value="en">English</option>
 *            <option value="fr">Français</option>
 *            <option value="ss">Soussou</option>
 *            <option value="ff">Peulh</option>
 *            <option value="kg">Malinké</option>
 *            <option value="kss">Kissi</option>
 *          </select>
 *        </>
 *      );
 *    }
 * 
 * 4. Crowdsourcing traductions:
 *    - Soussou: Contactez communauté locuteurs GN
 *    - Peulh: Support via Fula-speaking regions
 *    - Malinké: Mali/Guinea coordination
 *    - Kissi: Guinea/Liberia communities
 * 
 * 5. Maintenance:
 *    - Vérifier traductions trimestriellement
 *    - Ajouter nouvelles clés au fur et à mesure
 *    - Utiliser traducteurs natifs pour qualité
 */
