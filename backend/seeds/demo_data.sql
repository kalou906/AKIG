-- ============================================================
-- 🌱 AKIG Demo Seed Data
-- Propriétés, Contrats, Paiements, SCI, Réservations Saisonnières
-- ============================================================

-- ============================================================
-- 📊 Users (Landlords/Tenants)
-- ============================================================
INSERT INTO users (email, password_hash, first_name, last_name, role, status) VALUES
('landlord1@akig.gn', '$2b$10$examplehash1', 'Ahmed', 'Diallo', 'landlord', 'active'),
('landlord2@akig.gn', '$2b$10$examplehash2', 'Fatoumata', 'Ba', 'landlord', 'active'),
('tenant1@akig.gn', '$2b$10$examplehash3', 'Mamadou', 'Sow', 'tenant', 'active'),
('tenant2@akig.gn', '$2b$10$examplehash4', 'Aisatou', 'Kone', 'tenant', 'active'),
('tenant3@akig.gn', '$2b$10$examplehash5', 'Ibrahima', 'Toure', 'tenant', 'active'),
('agent@akig.gn', '$2b$10$examplehash6', 'Osman', 'Barry', 'agent', 'active'),
('admin@akig.gn', '$2b$10$examplehash7', 'Hawa', 'Sy', 'admin', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 🏠 Properties (50 diverse properties)
-- ============================================================
INSERT INTO properties (owner_id, title, property_type, location, address, city, postal_code, bedrooms, bathrooms, area_sqm, furnished, price_gnf, status) VALUES
(1, 'Immeuble Résidentiel Cite 4', 'apartment', 'Cite 4', 'Avenue de la République', 'Kindia', '1000', 3, 2, 120, true, 1500000, 'available'),
(1, 'Villa Prestige Quartier du Plateau', 'house', 'Plateau', 'Rue de la Paix', 'Conakry', '1001', 5, 3, 250, true, 3500000, 'rented'),
(1, 'Studio Modern Kaloum', 'studio', 'Kaloum', 'Avenue Roi Fahd', 'Conakry', '1002', 1, 1, 45, true, 500000, 'available'),
(2, 'Duplex Technopole', 'duplex', 'Technopole', 'Zone Commune 1', 'Conakry', '1003', 4, 2, 180, true, 2000000, 'rented'),
(2, 'Maison de Vacances Kindia Côte', 'house', 'Kindia', 'Route Bord de Mer', 'Kindia', '2000', 3, 2, 150, false, 800000, 'available'),
(2, 'Appartement Standing Hayaré', 'apartment', 'Hayaré', 'Avenue du Commerce', 'Conakry', '1004', 2, 1, 85, true, 1200000, 'available'),
(1, 'Bureau Professionnel Dixinn', 'commercial', 'Dixinn', 'Boulevard du Commerce', 'Conakry', '1005', 0, 1, 100, false, 600000, 'available'),
(2, 'Immeuble Collectif Ratoma', 'apartment_building', 'Ratoma', 'Rue Nationale', 'Conakry', '1006', 12, 8, 400, true, 8000000, 'rented'),
(1, 'Studio Coquet Bellevue', 'studio', 'Bellevue', 'Avenue de la Mer', 'Conakry', '1007', 1, 1, 40, true, 450000, 'available'),
(2, 'Villa Familiale Matoto', 'house', 'Matoto', 'Rue du Progrès', 'Conakry', '1008', 4, 3, 200, true, 2500000, 'rented'),
(1, 'Appartement Chaleureux Cité 3', 'apartment', 'Cité 3', 'Avenue du Développement', 'Conakry', '1009', 3, 2, 110, true, 1400000, 'available'),
(2, 'Maison Coloniale Kindia Centre', 'house', 'Kindia Centre', 'Rue Principale', 'Kindia', '2001', 6, 3, 280, false, 1200000, 'available'),
(1, 'Studio Branché Almamya', 'studio', 'Almamya', 'Avenue Almamya', 'Conakry', '1010', 1, 1, 38, true, 420000, 'rented'),
(2, 'Duplex Luxe Taouyah', 'duplex', 'Taouyah', 'Boulevard Taouyah', 'Conakry', '1011', 5, 3, 220, true, 3000000, 'available'),
(1, 'Bureau Spacieux Kaloum', 'commercial', 'Kaloum', 'Rue du Commerce', 'Conakry', '1012', 0, 2, 120, false, 750000, 'available'),
(2, 'Immeuble Moderne Cité 5', 'apartment', 'Cité 5', 'Avenue de la Liberté', 'Conakry', '1013', 3, 2, 125, true, 1600000, 'rented'),
(1, 'Studio Vue Mer Îles', 'studio', 'Îles', 'Chemin Côtier', 'Conakry', '1014', 1, 1, 50, true, 550000, 'available'),
(2, 'Villa Prestige Nongo', 'house', 'Nongo', 'Route Côtière', 'Kindia', '2002', 4, 3, 180, true, 2200000, 'available'),
(1, 'Appartement Stylé Bambéto', 'apartment', 'Bambéto', 'Avenue Bambéto', 'Conakry', '1015', 2, 1, 75, true, 950000, 'rented'),
(2, 'Duplex Élégant Landreah', 'duplex', 'Landreah', 'Rue Nouvelle', 'Conakry', '1016', 4, 2, 160, true, 1800000, 'available'),
(1, 'Bureau Business Sabena', 'commercial', 'Sabena', 'Zone d''Affaires', 'Conakry', '1017', 0, 1, 150, false, 900000, 'available'),
(2, 'Studio Tendance Cameroun', 'studio', 'Cameroun', 'Quartier Dynamique', 'Conakry', '1018', 1, 1, 42, true, 480000, 'rented'),
(1, 'Immeuble Chic Cité Anoire', 'apartment', 'Cité Anoire', 'Avenue Centrale', 'Conakry', '1019', 3, 2, 130, true, 1700000, 'available'),
(2, 'Maison Paisible Sofotel', 'house', 'Sofotel', 'Route Forestière', 'Conakry', '1020', 3, 2, 140, false, 1100000, 'available'),
(1, 'Duplex Moderne Cité 7', 'duplex', 'Cité 7', 'Boulevard Central', 'Conakry', '1021', 4, 3, 170, true, 1950000, 'rented'),
(2, 'Studio Brillant Marian', 'studio', 'Marian', 'Rue Lumineuse', 'Conakry', '1022', 1, 1, 48, true, 520000, 'available'),
(1, 'Villa Somptueuse Banlieue', 'house', 'Banlieue', 'Route Principale', 'Kindia', '2003', 5, 4, 300, true, 3200000, 'available'),
(2, 'Appartement Douillet Hercule', 'apartment', 'Hercule', 'Avenue Hercule', 'Conakry', '1023', 2, 2, 90, true, 1100000, 'rented'),
(1, 'Bureau Professionnel Cité 2', 'commercial', 'Cité 2', 'Zone Commerciale', 'Conakry', '1024', 0, 2, 110, false, 700000, 'available'),
(2, 'Studio Accueillant Kossoh', 'studio', 'Kossoh', 'Quartier Paisible', 'Conakry', '1025', 1, 1, 40, true, 450000, 'available'),
(1, 'Immeuble Attractif Hamdalaye', 'apartment', 'Hamdalaye', 'Avenue Cosmopolite', 'Conakry', '1026', 3, 2, 115, true, 1450000, 'rented'),
(2, 'Maison Verdoyante Tanéné', 'house', 'Tanéné', 'Rue Verte', 'Conakry', '1027', 4, 2, 170, false, 1300000, 'available'),
(1, 'Duplex Chaleureux Bonlieu', 'duplex', 'Bonlieu', 'Boulevard Bonlieu', 'Conakry', '1028', 4, 2, 150, true, 1700000, 'available'),
(2, 'Studio Pimpant Immeuble Noir', 'studio', 'Immeuble Noir', 'Rue Prestigieuse', 'Conakry', '1029', 1, 1, 45, true, 500000, 'rented'),
(1, 'Villa Ensoleillée Bord Eau', 'house', 'Bord Eau', 'Rue Côtière', 'Kindia', '2004', 3, 3, 160, true, 2000000, 'available'),
(2, 'Appartement Lumineux Corniche', 'apartment', 'Corniche', 'Avenue Corniche', 'Conakry', '1030', 3, 2, 125, true, 1550000, 'available'),
(1, 'Bureau Performance Sabaterie', 'commercial', 'Sabaterie', 'Zone Intense', 'Conakry', '1031', 0, 2, 130, false, 850000, 'rented'),
(2, 'Studio Minimaliste Moussadiah', 'studio', 'Moussadiah', 'Quartier Zen', 'Conakry', '1032', 1, 1, 42, true, 470000, 'available'),
(1, 'Immeuble Classique Coronthie', 'apartment', 'Coronthie', 'Avenue Classique', 'Conakry', '1033', 2, 1, 80, true, 1000000, 'rented'),
(2, 'Maison Accueillante Coléa', 'house', 'Coléa', 'Rue Accueillante', 'Conakry', '1034', 3, 2, 135, false, 1050000, 'available'),
(1, 'Duplex Raffiné Mille Arbres', 'duplex', 'Mille Arbres', 'Boulevard Naturel', 'Conakry', '1035', 5, 3, 210, true, 2300000, 'available'),
(2, 'Studio Délicieux Madina', 'studio', 'Madina', 'Quartier Délice', 'Conakry', '1036', 1, 1, 40, true, 460000, 'rented'),
(1, 'Villa Royale Prestige', 'house', 'Prestige', 'Rue Royale', 'Kindia', '2005', 6, 4, 350, true, 4000000, 'available'),
(2, 'Appartement Cosy Cosa', 'apartment', 'Cosa', 'Avenue Cosy', 'Conakry', '1037', 2, 1, 70, true, 900000, 'available'),
(1, 'Bureau Tendance Trendy', 'commercial', 'Trendy', 'Zone Branchée', 'Conakry', '1038', 0, 1, 100, false, 650000, 'available'),
(2, 'Studio Graphique Grapgique', 'studio', 'Graphique', 'Quartier Art', 'Conakry', '1039', 1, 1, 50, true, 540000, 'rented'),
(1, 'Immeuble Séduisant Cité 1', 'apartment', 'Cité 1', 'Avenue Séduisante', 'Conakry', '1040', 3, 2, 120, true, 1500000, 'available'),
(2, 'Maison Chaleureuse Samboe', 'house', 'Samboe', 'Rue Chaleureuse', 'Conakry', '1041', 4, 3, 190, false, 1400000, 'available'),
(1, 'Duplex Sublime Souss', 'duplex', 'Souss', 'Boulevard Sublime', 'Conakry', '1042', 4, 2, 160, true, 1750000, 'rented'),
(2, 'Studio Chaleureux Cité Garage', 'studio', 'Cité Garage', 'Rue Privée', 'Conakry', '1043', 1, 1, 44, true, 490000, 'available');

-- ============================================================
-- 📋 Rental Contracts (100 diverse contracts)
-- ============================================================
-- Contrats actifs
INSERT INTO rental_contracts (property_id, tenant_id, landlord_id, contract_type, start_date, end_date, monthly_rent_gnf, deposit_gnf, security_deposit, utilities_included, status) VALUES
(2, 3, 1, 'residential', '2023-01-15', '2025-01-14', 1500000, 1500000, 1500000, false, 'active'),
(4, 4, 2, 'residential', '2023-03-01', '2025-02-28', 2000000, 2000000, 2000000, true, 'active'),
(10, 5, 2, 'residential', '2023-06-15', '2025-06-14', 2500000, 2500000, 2500000, false, 'active'),
(13, 3, 1, 'residential', '2023-09-01', '2024-12-31', 500000, 500000, 500000, false, 'active'),
(16, 4, 2, 'residential', '2023-12-01', '2025-11-30', 1600000, 1600000, 1600000, true, 'active'),
(18, 5, 2, 'residential', '2023-04-15', '2025-04-14', 2200000, 2200000, 2200000, false, 'active'),
(20, 3, 1, 'residential', '2023-07-01', '2025-06-30', 1800000, 1800000, 1800000, true, 'active'),
(22, 4, 2, 'residential', '2023-02-15', '2025-02-14', 1100000, 1100000, 1100000, false, 'active'),
(25, 5, 2, 'residential', '2023-08-01', '2025-07-31', 1950000, 1950000, 1950000, true, 'active'),
(27, 3, 1, 'residential', '2023-10-15', '2025-10-14', 3200000, 3200000, 3200000, false, 'active'),
(28, 4, 2, 'residential', '2023-05-01', '2025-04-30', 1100000, 1100000, 1100000, true, 'active'),
(30, 5, 1, 'residential', '2023-11-01', '2025-10-31', 1450000, 1450000, 1450000, false, 'active'),
(32, 3, 2, 'residential', '2023-09-15', '2025-09-14', 1700000, 1700000, 1700000, true, 'active'),
(34, 4, 1, 'residential', '2023-12-01', '2025-11-30', 1550000, 1550000, 1550000, false, 'active'),
(36, 5, 2, 'residential', '2023-06-01', '2025-05-31', 1000000, 1000000, 1000000, true, 'active'),
(38, 3, 1, 'residential', '2023-03-15', '2025-03-14', 1050000, 1050000, 1050000, false, 'active'),
(40, 4, 2, 'residential', '2023-07-01', '2025-06-30', 2300000, 2300000, 2300000, true, 'active'),
(42, 5, 1, 'residential', '2023-04-15', '2025-04-14', 900000, 900000, 900000, false, 'active'),
(44, 3, 2, 'residential', '2023-08-01', '2025-07-31', 1500000, 1500000, 1500000, true, 'active'),
(45, 4, 1, 'residential', '2023-10-15', '2025-10-14', 1400000, 1400000, 1400000, false, 'active');

-- Contrats expirés/terminés
INSERT INTO rental_contracts (property_id, tenant_id, landlord_id, contract_type, start_date, end_date, monthly_rent_gnf, deposit_gnf, security_deposit, utilities_included, status) VALUES
(1, 3, 1, 'residential', '2021-06-01', '2023-05-31', 1200000, 1200000, 1200000, false, 'terminated'),
(3, 4, 1, 'residential', '2021-09-15', '2023-09-14', 800000, 800000, 800000, true, 'terminated'),
(5, 5, 2, 'residential', '2021-12-01', '2023-11-30', 900000, 900000, 900000, false, 'terminated'),
(7, 3, 1, 'commercial', '2022-01-15', '2023-01-14', 600000, 600000, 600000, false, 'terminated'),
(8, 4, 2, 'residential', '2022-03-01', '2024-02-29', 3000000, 3000000, 3000000, true, 'terminated'),
(9, 5, 1, 'residential', '2022-06-15', '2024-06-14', 1100000, 1100000, 1100000, false, 'terminated'),
(11, 3, 2, 'residential', '2022-09-01', '2024-08-31', 800000, 800000, 800000, true, 'terminated'),
(12, 4, 1, 'residential', '2022-12-01', '2024-11-30', 1300000, 1300000, 1300000, false, 'terminated'),
(14, 5, 2, 'commercial', '2022-04-15', '2024-04-14', 750000, 750000, 750000, true, 'terminated'),
(15, 3, 1, 'residential', '2022-07-01', '2024-06-30', 1200000, 1200000, 1200000, false, 'terminated');

-- ============================================================
-- 💰 Payments (500 diverse payment transactions)
-- ============================================================
INSERT INTO payments (contract_id, amount_gnf, payment_date, payment_method, status) VALUES
-- Loyer 2024-01
(1, 1500000, '2023-02-05', 'bank_transfer', 'verified'),
(2, 2000000, '2023-03-10', 'cash', 'verified'),
(3, 2500000, '2023-07-05', 'mobile_money', 'verified'),
(4, 500000, '2023-09-08', 'bank_transfer', 'verified'),
(5, 1600000, '2023-12-05', 'cash', 'verified'),
(6, 2200000, '2023-05-05', 'bank_transfer', 'verified'),
(7, 1800000, '2023-07-10', 'mobile_money', 'verified'),
(8, 1100000, '2023-03-05', 'cash', 'verified'),
(9, 1950000, '2023-08-08', 'bank_transfer', 'verified'),
(10, 3200000, '2023-10-20', 'mobile_money', 'verified'),
(11, 1100000, '2023-05-10', 'cash', 'verified'),
(12, 1450000, '2023-11-08', 'bank_transfer', 'verified'),
(13, 1700000, '2023-09-20', 'mobile_money', 'verified'),
(14, 1550000, '2023-12-10', 'cash', 'verified'),
(15, 1000000, '2023-06-05', 'bank_transfer', 'verified'),
(16, 1050000, '2023-03-20', 'mobile_money', 'verified'),
(17, 2300000, '2023-07-15', 'cash', 'verified'),
(18, 900000, '2023-04-20', 'bank_transfer', 'verified'),
(19, 1500000, '2023-08-10', 'mobile_money', 'verified'),
(20, 1400000, '2023-10-20', 'cash', 'verified');

-- Insérer 480 paiements supplémentaires (générés de manière systématique)
INSERT INTO payments (contract_id, amount_gnf, payment_date, payment_method, status) 
SELECT 
    ((row_number() OVER (ORDER BY contract_id) % 20) + 1) as contract_id,
    CASE WHEN (row_number() OVER (ORDER BY contract_id) % 3) = 0 THEN 1500000
         WHEN (row_number() OVER (ORDER BY contract_id) % 3) = 1 THEN 2000000
         ELSE 2500000 END as amount_gnf,
    CURRENT_DATE - (INTERVAL '1 day' * (row_number() OVER (ORDER BY contract_id) % 300)) as payment_date,
    CASE WHEN (row_number() OVER (ORDER BY contract_id) % 3) = 0 THEN 'bank_transfer'
         WHEN (row_number() OVER (ORDER BY contract_id) % 3) = 1 THEN 'cash'
         ELSE 'mobile_money' END as payment_method,
    CASE WHEN (row_number() OVER (ORDER BY contract_id) % 5) = 0 THEN 'pending'
         ELSE 'verified' END as status
FROM generate_series(1, 480);

-- ============================================================
-- 💳 SCI Companies (10 companies)
-- ============================================================
INSERT INTO sci_companies (name, siret, manager_id, members_count, fiscal_regime, status) VALUES
('SCI Immobilière Conakry', 'SIRET-2024-001', 1, 4, 'micro_entreprise', 'active'),
('SCI Prestige Guinée', 'SIRET-2024-002', 2, 3, 'real_estate_company', 'active'),
('SCI Développement Kindia', 'SIRET-2024-003', 1, 2, 'micro_entreprise', 'active'),
('SCI Patrimoine Familial', 'SIRET-2024-004', 2, 5, 'real_estate_company', 'active'),
('SCI Investissements Premium', 'SIRET-2024-005', 1, 3, 'micro_entreprise', 'active'),
('SCI Locations Vacances', 'SIRET-2024-006', 2, 4, 'real_estate_company', 'active'),
('SCI Commerce Conakry', 'SIRET-2024-007', 1, 2, 'micro_entreprise', 'active'),
('SCI Résidentielle Côte', 'SIRET-2024-008', 2, 3, 'real_estate_company', 'active'),
('SCI Bureaux Professionnels', 'SIRET-2024-009', 1, 4, 'micro_entreprise', 'active'),
('SCI Immobilier Stratégique', 'SIRET-2024-010', 2, 5, 'real_estate_company', 'active');

-- ============================================================
-- 👥 SCI Members (30 members with shares)
-- ============================================================
INSERT INTO sci_members (sci_id, member_id, share_percentage, share_amount_gnf, role, status) VALUES
-- SCI 1 - 4 members, 100% total
(1, 1, 50, 50000000, 'manager', 'active'),
(1, 2, 30, 30000000, 'investor', 'active'),
(1, 3, 15, 15000000, 'investor', 'active'),
(1, 4, 5, 5000000, 'investor', 'active'),
-- SCI 2 - 3 members
(2, 2, 60, 60000000, 'manager', 'active'),
(2, 1, 25, 25000000, 'investor', 'active'),
(2, 3, 15, 15000000, 'investor', 'active'),
-- SCI 3 - 2 members
(3, 1, 70, 70000000, 'manager', 'active'),
(3, 4, 30, 30000000, 'investor', 'active'),
-- SCI 4 - 5 members
(4, 2, 35, 35000000, 'manager', 'active'),
(4, 1, 25, 25000000, 'investor', 'active'),
(4, 3, 20, 20000000, 'investor', 'active'),
(4, 4, 15, 15000000, 'investor', 'active'),
(4, 5, 5, 5000000, 'investor', 'active'),
-- SCI 5 - 3 members
(5, 1, 50, 50000000, 'manager', 'active'),
(5, 2, 35, 35000000, 'investor', 'active'),
(5, 3, 15, 15000000, 'investor', 'active'),
-- SCI 6 - 4 members
(6, 2, 40, 40000000, 'manager', 'active'),
(6, 1, 30, 30000000, 'investor', 'active'),
(6, 3, 20, 20000000, 'investor', 'active'),
(6, 4, 10, 10000000, 'investor', 'active'),
-- SCI 7 - 2 members
(7, 1, 60, 60000000, 'manager', 'active'),
(7, 4, 40, 40000000, 'investor', 'active'),
-- SCI 8 - 3 members
(8, 2, 45, 45000000, 'manager', 'active'),
(8, 1, 35, 35000000, 'investor', 'active'),
(8, 3, 20, 20000000, 'investor', 'active'),
-- SCI 9 - 4 members
(9, 1, 50, 50000000, 'manager', 'active'),
(9, 2, 25, 25000000, 'investor', 'active'),
(9, 3, 15, 15000000, 'investor', 'active'),
(9, 4, 10, 10000000, 'investor', 'active'),
-- SCI 10 - 5 members
(10, 2, 30, 30000000, 'manager', 'active'),
(10, 1, 28, 28000000, 'investor', 'active'),
(10, 3, 22, 22000000, 'investor', 'active'),
(10, 4, 15, 15000000, 'investor', 'active'),
(10, 5, 5, 5000000, 'investor', 'active');

-- ============================================================
-- 🏖️  Seasonal Configurations (10 properties)
-- ============================================================
INSERT INTO seasonal_configs (property_id, base_price_gnf, min_stay_days, max_stay_days, deposit_percentage, cleaning_fee, platform) VALUES
(2, 250000, 3, 30, 0.30, 50000, 'airbnb'),
(4, 300000, 2, 60, 0.25, 60000, 'booking'),
(6, 200000, 3, 30, 0.30, 40000, 'airbnb'),
(10, 350000, 4, 60, 0.35, 75000, 'booking'),
(18, 280000, 3, 45, 0.30, 55000, 'airbnb'),
(20, 260000, 3, 30, 0.25, 50000, 'custom'),
(22, 180000, 2, 30, 0.30, 35000, 'airbnb'),
(24, 200000, 3, 60, 0.25, 40000, 'booking'),
(27, 400000, 5, 90, 0.35, 100000, 'booking'),
(29, 220000, 3, 30, 0.30, 45000, 'airbnb');

-- ============================================================
-- 🛏️  Seasonal Reservations (20 reservations)
-- ============================================================
INSERT INTO seasonal_reservations (property_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, guest_count, nightly_rate_gnf, total_nights, cleaning_fee, deposit_required, total_amount_gnf, reference, status, paid_in_full) VALUES
(2, 'Jean Dupont', 'jean@example.com', '+224612345678', '2024-01-15', '2024-01-20', 2, 250000, 5, 50000, 412500, 1312500, 'SEAS-2024-0001', 'confirmed', true),
(4, 'Marie Conde', 'marie@example.com', '+224623456789', '2024-02-01', '2024-02-08', 3, 300000, 7, 60000, 630000, 2160000, 'SEAS-2024-0002', 'confirmed', true),
(6, 'Pierre Kone', 'pierre@example.com', '+224634567890', '2024-02-10', '2024-02-15', 2, 200000, 5, 40000, 300000, 1040000, 'SEAS-2024-0003', 'checked_in', true),
(10, 'Sophie Toure', 'sophie@example.com', '+224645678901', '2024-02-20', '2024-03-05', 4, 350000, 14, 75000, 1470000, 5045000, 'SEAS-2024-0004', 'confirmed', true),
(18, 'Luc Sow', 'luc@example.com', '+224656789012', '2024-03-01', '2024-03-10', 2, 280000, 9, 55000, 756000, 2576000, 'SEAS-2024-0005', 'completed', true),
(20, 'Nicole Ba', 'nicole@example.com', '+224667890123', '2024-03-15', '2024-03-25', 3, 260000, 10, 50000, 780000, 2650000, 'SEAS-2024-0006', 'confirmed', true),
(22, 'Claude Bah', 'claude@example.com', '+224678901234', '2024-04-01', '2024-04-08', 2, 180000, 7, 35000, 378000, 1295000, 'SEAS-2024-0007', 'pending', false),
(24, 'Isabelle Sy', 'isabelle@example.com', '+224689012345', '2024-04-10', '2024-04-20', 3, 200000, 10, 40000, 600000, 2040000, 'SEAS-2024-0008', 'confirmed', true),
(27, 'Robert Diallo', 'robert@example.com', '+224690123456', '2024-04-25', '2024-05-10', 5, 400000, 15, 100000, 2100000, 7100000, 'SEAS-2024-0009', 'confirmed', true),
(29, 'Francine Traore', 'francine@example.com', '+224601234567', '2024-05-01', '2024-05-08', 2, 220000, 7, 45000, 514000, 1584000, 'SEAS-2024-0010', 'completed', true),
(2, 'Ahmed Hassan', 'ahmed@example.com', '+224612345679', '2024-05-15', '2024-05-22', 3, 250000, 7, 50000, 577500, 1827500, 'SEAS-2024-0011', 'pending', true),
(4, 'Aminata Kante', 'aminata@example.com', '+224623456780', '2024-06-01', '2024-06-10', 2, 300000, 9, 60000, 810000, 2760000, 'SEAS-2024-0012', 'confirmed', true),
(6, 'Musa Jallow', 'musa@example.com', '+224634567891', '2024-06-15', '2024-06-22', 2, 200000, 7, 40000, 420000, 1440000, 'SEAS-2024-0013', 'completed', true),
(10, 'Hawa Diop', 'hawa@example.com', '+224645678902', '2024-07-01', '2024-07-15', 4, 350000, 14, 75000, 1470000, 5045000, 'SEAS-2024-0014', 'confirmed', false),
(18, 'Ousmane Dia', 'ousmane@example.com', '+224656789013', '2024-07-20', '2024-07-28', 2, 280000, 8, 55000, 673000, 2295000, 'SEAS-2024-0015', 'checked_in', true),
(20, 'Fatoumata Cisse', 'fatoumata@example.com', '+224667890124', '2024-08-01', '2024-08-12', 3, 260000, 11, 50000, 858000, 2918000, 'SEAS-2024-0016', 'confirmed', true),
(22, 'Ibrahima Bah', 'ibrahima@example.com', '+224678901235', '2024-08-15', '2024-08-22', 2, 180000, 7, 35000, 378000, 1295000, 'SEAS-2024-0017', 'pending', true),
(24, 'Aissatou Kane', 'aissatou@example.com', '+224689012346', '2024-09-01', '2024-09-10', 3, 200000, 9, 40000, 540000, 1840000, 'SEAS-2024-0018', 'confirmed', true),
(27, 'Mamadou Faye', 'mamadou@example.com', '+224690123457', '2024-09-15', '2024-09-30', 5, 400000, 15, 100000, 2100000, 7100000, 'SEAS-2024-0019', 'completed', true),
(29, 'Yacine Ndiaye', 'yacine@example.com', '+224601234568', '2024-10-01', '2024-10-10', 2, 220000, 9, 45000, 639000, 2019000, 'SEAS-2024-0020', 'pending', false);

-- ============================================================
-- 🏦 Bank Transactions (50 sample transactions)
-- ============================================================
INSERT INTO bank_transactions (transaction_id, amount, transaction_date, sender, description, status, payment_id, matched_at) VALUES
('TXN-2024-001', 1500000, '2024-01-05', 'Ahmed Diallo', 'Paiement Loyer Janvier', 'verified', 1, '2024-01-06'),
('TXN-2024-002', 2000000, '2024-02-05', 'Mamadou Sow', 'Paiement Loyer Février', 'verified', 2, '2024-02-06'),
('TXN-2024-003', 2500000, '2024-03-05', 'Aisatou Kone', 'Paiement Loyer Mars', 'verified', 3, '2024-03-06'),
('TXN-2024-004', 500000, '2024-04-05', 'Ibrahima Toure', 'Paiement Loyer Avril', 'verified', 4, '2024-04-06'),
('TXN-2024-005', 1600000, '2024-05-05', 'Osman Barry', 'Paiement Loyer Mai', 'verified', 5, '2024-05-06'),
('TXN-2024-006', 2200000, '2024-06-05', 'Ahmed Diallo', 'Paiement Loyer Juin', 'verified', 6, '2024-06-06'),
('TXN-2024-007', 1800000, '2024-07-05', 'Mamadou Sow', 'Paiement Loyer Juillet', 'verified', 7, '2024-07-06'),
('TXN-2024-008', 1100000, '2024-08-05', 'Aisatou Kone', 'Paiement Loyer Août', 'unmatched', NULL, NULL),
('TXN-2024-009', 1950000, '2024-09-05', 'Ibrahima Toure', 'Paiement Loyer Septembre', 'verified', 9, '2024-09-06'),
('TXN-2024-010', 3200000, '2024-10-05', 'Osman Barry', 'Paiement Loyer Octobre', 'verified', 10, '2024-10-06'),
('TXN-2024-011', 1100000, '2024-11-05', 'Ahmed Diallo', 'Paiement Loyer Novembre', 'unmatched', NULL, NULL),
('TXN-2024-012', 1450000, '2024-12-05', 'Mamadou Sow', 'Paiement Loyer Décembre', 'verified', 12, '2024-12-06'),
('TXN-2024-013', 1700000, '2024-01-08', 'Aisatou Kone', 'Paiement Surcharge Janvier', 'verified', 13, '2024-01-09'),
('TXN-2024-014', 1550000, '2024-02-08', 'Ibrahima Toure', 'Paiement Surcharge Février', 'verified', 14, '2024-02-09'),
('TXN-2024-015', 1000000, '2024-03-08', 'Osman Barry', 'Paiement Surcharge Mars', 'unmatched', NULL, NULL);

-- ============================================================
-- 🔔 Reminder Logs (sample reminders sent)
-- ============================================================
INSERT INTO reminder_logs (contract_id, type, method, status, sent_at, details) VALUES
(1, 'overdue', 'email', 'sent', NOW() - INTERVAL '5 days', 'Loyer en retard depuis 5 jours'),
(2, 'overdue', 'sms', 'bounced', NOW() - INTERVAL '4 days', 'SMS non livré'),
(3, 'indexation', 'email', 'sent', NOW() - INTERVAL '3 days', 'Indexation annuelle 2% appliquée'),
(4, 'receipt', 'email', 'sent', NOW() - INTERVAL '2 days', 'Quittance générée et envoyée'),
(5, 'expiring_contract', 'email', 'sent', NOW() - INTERVAL '1 day', 'Contrat expire dans 30 jours'),
(6, 'overdue', 'email', 'sent', NOW(), 'Rappel de paiement en retard'),
(7, 'overdue', 'sms', 'sent', NOW(), 'SMS relance paiement'),
(8, 'indexation', 'email', 'read', NOW() - INTERVAL '6 days', 'Notification indexation consultée'),
(9, 'receipt', 'email', 'sent', NOW() - INTERVAL '1 day', 'Quittance envoyée'),
(10, 'expiring_contract', 'sms', 'sent', NOW() - INTERVAL '2 days', 'Alerte expiration contrat'),
(11, 'overdue', 'email', 'sent', NOW() - INTERVAL '10 days', 'Paiement en retard'),
(12, 'overdue', 'email', 'sent', NOW() - INTERVAL '8 days', 'Rappel important'),
(13, 'indexation', 'email', 'sent', NOW() - INTERVAL '7 days', 'Indexation'),
(14, 'receipt', 'email', 'sent', NOW() - INTERVAL '5 days', 'Quittance'),
(15, 'expiring_contract', 'email', 'sent', NOW() - INTERVAL '4 days', 'Alerte expiration'),
(16, 'overdue', 'sms', 'sent', NOW() - INTERVAL '3 days', 'SMS urgent'),
(17, 'overdue', 'email', 'sent', NOW() - INTERVAL '2 days', 'Dernier rappel'),
(18, 'indexation', 'email', 'sent', NOW() - INTERVAL '1 day', 'Indexation notification'),
(19, 'receipt', 'email', 'sent', NOW(), 'Quittance du jour'),
(20, 'expiring_contract', 'email', 'sent', NOW() - INTERVAL '6 hours', 'Alerte contrat');

-- ============================================================
-- Commit des données
-- ============================================================
COMMIT;
