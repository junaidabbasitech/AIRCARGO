--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: airlines; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.airlines VALUES
	(69, 'IndiGo', '6E', '6E', 'IGO', 'IN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.506187+00', '2026-03-20 21:01:38.738419+00'),
	(14, 'Air Canada', 'AC', 'AC', 'ACA', 'CA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.557492+00', '2026-03-20 21:01:38.494075+00'),
	(80, 'Azul Brazilian Airlines', 'AD', 'AD', 'AZU', 'BR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.564142+00', '2026-03-20 21:01:38.787636+00'),
	(25, 'Air France', 'AF', 'AF', 'AFR', 'FR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.572313+00', '2026-03-20 21:01:38.545369+00'),
	(70, 'Air India', 'AI', 'AI', 'AIC', 'IN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.585608+00', '2026-03-20 21:01:38.742728+00'),
	(68, 'AirAsia', 'AK', 'AK', 'AXM', 'MY', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.593142+00', '2026-03-20 21:01:38.734024+00'),
	(5, 'Alaska Airlines', 'AS', 'AS', 'ASA', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.608463+00', '2026-03-20 21:01:38.451009+00'),
	(77, 'Avianca', 'AV', 'AV', 'AVA', 'CO', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.619858+00', '2026-03-20 21:01:38.774254+00'),
	(36, 'Finnair', 'AY', 'AY', 'FIN', 'FI', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.626476+00', '2026-03-20 21:01:38.59392+00'),
	(33, 'Alitalia', 'AZ', 'AZ', 'AZA', 'IT', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.632732+00', '2026-03-20 21:01:38.58077+00'),
	(6, 'JetBlue Airways', 'B6', 'B6', 'JBU', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.641573+00', '2026-03-20 21:01:38.455349+00'),
	(57, 'EVA Air', 'BR', 'BR', 'EVA', 'TW', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.660777+00', '2026-03-20 21:01:38.685118+00'),
	(81, 'Caribbean Airlines', 'BW', 'BW', 'BWA', 'TT', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.672691+00', '2026-03-20 21:01:38.791897+00'),
	(60, 'Air China', 'CA', 'CA', 'CCA', 'CN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.679068+00', '2026-03-20 21:01:38.697957+00'),
	(56, 'China Airlines', 'CI', 'CI', 'CAL', 'TW', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.685249+00', '2026-03-20 21:01:38.680405+00'),
	(76, 'Copa Airlines', 'CM', 'CM', 'CMP', 'PA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.691838+00', '2026-03-20 21:01:38.770001+00'),
	(51, 'Cathay Pacific', 'CX', 'CX', 'CPA', 'HK', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.696585+00', '2026-03-20 21:01:38.658446+00'),
	(59, 'China Southern Airlines', 'CZ', 'CZ', 'CSN', 'CN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.702518+00', '2026-03-20 21:01:38.693704+00'),
	(2, 'Delta Air Lines', 'DL', 'DL', 'DAL', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.708654+00', '2026-03-20 21:01:38.435586+00'),
	(37, 'Norwegian Air Shuttle', 'DY', 'DY', 'NAX', 'NO', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.716178+00', '2026-03-20 21:01:38.598088+00'),
	(52, 'Japan Airlines', 'JL', 'JL', 'JAL', 'JP', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.860205+00', '2026-03-20 21:01:38.66323+00'),
	(41, 'Etihad Airways', 'EY', 'EY', 'ETD', 'AE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.742623+00', '2026-03-20 21:01:38.61549+00'),
	(23, 'Aer Lingus', 'EI', 'EI', 'EIN', 'IE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.72258+00', '2026-03-20 21:01:38.536421+00'),
	(17, 'Air Transat', 'TS', 'TS', 'TSC', 'CA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.129492+00', '2026-03-20 21:01:38.50793+00'),
	(8, 'Frontier Airlines', 'F9', 'F9', 'FFT', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.749459+00', '2026-03-20 21:01:38.465243+00'),
	(39, 'Emirates', 'EK', 'EK', 'UAE', 'AE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.729261+00', '2026-03-20 21:01:38.607626+00'),
	(22, 'Ryanair', 'FR', 'FR', 'RYR', 'IE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.758253+00', '2026-03-20 21:01:38.531935+00'),
	(78, 'GOL Linhas Aereas', 'G3', 'G3', 'GLO', 'BR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.77175+00', '2026-03-20 21:01:38.779042+00'),
	(55, 'Asiana Airlines', 'OZ', 'OZ', 'AAR', 'KR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.995475+00', '2026-03-20 21:01:38.676217+00'),
	(54, 'Korean Air', 'KE', 'KE', 'KAL', 'KR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.878104+00', '2026-03-20 21:01:38.672233+00'),
	(9, 'Allegiant Air', 'G4', 'G4', 'AAY', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.779144+00', '2026-03-20 21:01:38.470082+00'),
	(43, 'Air Arabia', 'G9', 'G9', 'ABY', 'AE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.789216+00', '2026-03-20 21:01:38.623733+00'),
	(1, 'American Airlines Test', 'AA', 'AA', 'AAL', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:45:58.009+00', '2026-03-20 21:01:38.430068+00'),
	(66, 'Garuda Indonesia', 'GA', 'GA', 'GIA', 'ID', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.80387+00', '2026-03-20 21:01:38.725364+00'),
	(82, 'Bahamasair', 'UP', 'UP', 'BHS', 'BS', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.169265+00', '2026-03-20 21:01:38.795593+00'),
	(18, 'Porter Airlines', 'PD', 'PD', 'POE', 'CA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.003277+00', '2026-03-20 21:01:38.512755+00'),
	(49, 'Gulf Air', 'GF', 'GF', 'GFA', 'BH', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.810552+00', '2026-03-20 21:01:38.649917+00'),
	(10, 'Hawaiian Airlines', 'HA', 'HA', 'HAL', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.818027+00', '2026-03-20 21:01:38.474882+00'),
	(47, 'Oman Air', 'WY', 'WY', 'OMA', 'OM', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.220293+00', '2026-03-20 21:01:38.641333+00'),
	(63, 'Bangkok Airways', 'PG', 'PG', 'BKP', 'TH', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.010311+00', '2026-03-20 21:01:38.712485+00'),
	(13, 'Avelo Airlines', 'XP', 'XP', 'VXP', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.226147+00', '2026-03-20 21:01:38.488613+00'),
	(61, 'Hainan Airlines', 'HU', 'HU', 'CHH', 'CN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.826711+00', '2026-03-20 21:01:38.703423+00'),
	(30, 'Iberia', 'IB', 'IB', 'IBE', 'ES', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.83396+00', '2026-03-20 21:01:38.568358+00'),
	(79, 'LATAM Brasil', 'JJ', 'JJ', 'TAM', 'BR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.854701+00', '2026-03-20 21:01:38.783115+00'),
	(65, 'Philippine Airlines', 'PR', 'PR', 'PAL', 'PH', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.028277+00', '2026-03-20 21:01:38.720988+00'),
	(48, 'Kuwait Airways', 'KU', 'KU', 'KAC', 'KW', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.896348+00', '2026-03-20 21:01:38.645157+00'),
	(75, 'LATAM Airlines', 'LA', 'LA', 'LAN', 'CL', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.907262+00', '2026-03-20 21:01:38.765274+00'),
	(24, 'Lufthansa', 'LH', 'LH', 'DLH', 'DE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.913953+00', '2026-03-20 21:01:38.541007+00'),
	(46, 'Middle East Airlines', 'ME', 'ME', 'MEA', 'LB', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.93875+00', '2026-03-20 21:01:38.63685+00'),
	(67, 'Malaysia Airlines', 'MH', 'MH', 'MAS', 'MY', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.944792+00', '2026-03-20 21:01:38.729719+00'),
	(58, 'China Eastern Airlines', 'MU', 'MU', 'CES', 'CN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.955537+00', '2026-03-20 21:01:38.688844+00'),
	(12, 'Breeze Airways', 'MX', 'MX', 'BZE', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.961959+00', '2026-03-20 21:01:38.484125+00'),
	(53, 'All Nippon Airways', 'NH', 'NH', 'ANA', 'JP', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.967283+00', '2026-03-20 21:01:38.668167+00'),
	(28, 'Austrian Airlines', 'OS', 'OS', 'AUA', 'AT', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.988583+00', '2026-03-20 21:01:38.5589+00'),
	(40, 'Qatar Airways', 'QR', 'QR', 'QTR', 'QA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.048019+00', '2026-03-20 21:01:38.611813+00'),
	(45, 'Royal Jordanian', 'RJ', 'RJ', 'RJA', 'JO', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.058819+00', '2026-03-20 21:01:38.631542+00'),
	(15, 'Air Canada Rouge', 'RV', 'RV', 'ROU', 'CA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.064991+00', '2026-03-20 21:01:38.49828+00'),
	(35, 'Scandinavian Airlines', 'SK', 'SK', 'SAS', 'SE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.081498+00', '2026-03-20 21:01:38.589021+00'),
	(29, 'Brussels Airlines', 'SN', 'SN', 'BEL', 'BE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.086972+00', '2026-03-20 21:01:38.563739+00'),
	(50, 'Singapore Airlines', 'SQ', 'SQ', 'SIA', 'SG', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.092932+00', '2026-03-20 21:01:38.653828+00'),
	(44, 'Saudia', 'SV', 'SV', 'SVA', 'SA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.10544+00', '2026-03-20 21:01:38.627842+00'),
	(91, 'Air Algerie', 'AH', 'AH', 'DAH', 'DZ', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.579508+00', '2026-03-20 21:01:38.83469+00'),
	(89, 'Royal Air Maroc', 'AT', 'AT', 'RAM', 'MA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.613885+00', '2026-03-20 21:01:38.825525+00'),
	(109, 'Biman Bangladesh Airlines', 'BG', 'BG', 'BBC', 'BD', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.654809+00', '2026-03-20 21:01:38.908884+00'),
	(101, 'Air Baltic', 'BT', 'BT', 'BTI', 'LV', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.666132+00', '2026-03-20 21:01:38.875998+00'),
	(85, 'Ethiopian Airlines', 'ET', 'ET', 'ETH', 'ET', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.736219+00', '2026-03-20 21:01:38.808564+00'),
	(105, 'Iran Air', 'IR', 'IR', 'IRA', 'IR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.839648+00', '2026-03-20 21:01:38.891799+00'),
	(104, 'Arkia', 'IZ', 'IZ', 'AIZ', 'IL', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.846679+00', '2026-03-20 21:01:38.888166+00'),
	(84, 'Air Jamaica', 'JM', 'JM', 'AJM', 'JM', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.865437+00', '2026-03-20 21:01:38.803709+00'),
	(86, 'Kenya Airways', 'KQ', 'KQ', 'KQA', 'KE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.889799+00', '2026-03-20 21:01:38.812788+00'),
	(83, 'Cayman Airways', 'KX', 'KX', 'CAY', 'KY', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.901929+00', '2026-03-20 21:01:38.799096+00'),
	(97, 'LOT Polish Airlines', 'LO', 'LO', 'LOT', 'PL', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.920175+00', '2026-03-20 21:01:38.860529+00'),
	(103, 'El Al Israel Airlines', 'LY', 'LY', 'ELY', 'IL', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.932879+00', '2026-03-20 21:01:38.884029+00'),
	(88, 'Egyptair', 'MS', 'MS', 'MSR', 'EG', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.950018+00', '2026-03-20 21:01:38.821361+00'),
	(92, 'Air New Zealand', 'NZ', 'NZ', 'ANZ', 'NZ', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.977501+00', '2026-03-20 21:01:38.839254+00'),
	(98, 'Czech Airlines', 'OK', 'OK', 'CSA', 'CZ', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.983031+00', '2026-03-20 21:01:38.864765+00'),
	(106, 'Pakistan International Airlines', 'PK', 'PK', 'PIA', 'PK', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.021475+00', '2026-03-20 21:01:38.895858+00'),
	(108, 'Maldivian', 'Q2', 'Q2', 'DQA', 'MV', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.034328+00', '2026-03-20 21:01:38.904794+00'),
	(93, 'Qantas', 'QF', 'QF', 'QFA', 'AU', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.041181+00', '2026-03-20 21:01:38.843796+00'),
	(110, 'Nepal Airlines', 'RA', 'RA', 'RNA', 'NP', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.053032+00', '2026-03-20 21:01:38.913763+00'),
	(87, 'South African Airways', 'SA', 'SA', 'SAA', 'ZA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.070166+00', '2026-03-20 21:01:38.817007+00'),
	(95, 'Aeroflot', 'SU', 'SU', 'AFL', 'RU', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.09915+00', '2026-03-20 21:01:38.852037+00'),
	(100, 'Aegean Airlines', 'A3', 'A3', 'AEE', 'GR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.540212+00', '2026-03-20 21:01:38.872243+00'),
	(72, 'Aeromexico', 'AM', 'AM', 'AMX', 'MX', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.600577+00', '2026-03-20 21:01:38.751812+00'),
	(230, 'Sky Lease Cargo', 'GG', 'GG', 'GGN', 'US', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.990476+00', '2026-03-20 21:20:16.990476+00'),
	(221, 'Silk Way West Airlines', '7L', '7L', 'AZG', 'AZ', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.902405+00', '2026-03-20 21:20:16.902405+00'),
	(223, 'Kalitta Air', 'K4', 'K4', 'CKS', 'US', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.954865+00', '2026-03-20 21:20:16.954865+00'),
	(224, 'Cargolux Airlines International', 'CV', 'CV', 'CLX', 'LU', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.958884+00', '2026-03-20 21:20:16.958884+00'),
	(225, 'China Cargo Airlines', 'CK', 'CK', 'CKK', 'CN', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.966851+00', '2026-03-20 21:20:16.966851+00'),
	(228, 'Yemenia Yemen Airways', 'IY', 'IY', 'IYE', 'YE', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.97976+00', '2026-03-20 21:20:16.97976+00'),
	(229, 'Martinair Holland', 'MP', 'MP', 'MPH', 'NL', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.985587+00', '2026-03-20 21:20:16.985587+00'),
	(231, 'Cargojet Airways', 'W8', 'W8', 'CJT', 'CA', 'approved', 'xlsx_import', false, '2026-03-20 21:20:16.994735+00', '2026-03-20 21:20:16.994735+00'),
	(234, 'Polar Air Cargo', 'PO', 'PO', 'PAC', 'US', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.009801+00', '2026-03-20 21:20:17.009801+00'),
	(235, 'Hong Kong Airlines', 'HX', 'HX', 'CRK', 'HK', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.018022+00', '2026-03-20 21:20:17.018022+00'),
	(236, 'Xiamen Airlines', 'MF', 'MF', 'CXA', 'CN', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.021777+00', '2026-03-20 21:20:17.021777+00'),
	(237, 'Ukraine International Airlines', 'PS', 'PS', 'AUI', 'UA', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.024648+00', '2026-03-20 21:20:17.024648+00'),
	(238, 'DHL Aviation', 'D0', 'D0', 'DHK', 'BH', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.0308+00', '2026-03-20 21:20:17.0308+00'),
	(239, 'Nippon Cargo Airlines', 'KZ', 'KZ', 'NCA', 'JP', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.033923+00', '2026-03-20 21:20:17.033923+00'),
	(240, 'Suparna Airlines', 'Y8', 'Y8', 'GCR', 'CN', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.039104+00', '2026-03-20 21:20:17.039104+00'),
	(241, 'MNG Airlines', 'MB', 'MB', 'MNB', 'TR', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.042835+00', '2026-03-20 21:20:17.042835+00'),
	(242, 'TNT Airways', '3V', '3V', 'TAY', 'BE', 'approved', 'xlsx_import', false, '2026-03-20 21:20:17.046419+00', '2026-03-20 21:20:17.046419+00'),
	(233, 'Air Serbia', 'JU', 'JU', 'ASL', 'RS', 'approved', 'xlsx_import', false, '2026-03-20 22:51:12.439+00', '2026-03-20 21:20:17.003653+00'),
	(232, 'Amerijet International', 'M6', 'M6', 'AJT', 'US', 'approved', 'xlsx_import', false, '2026-03-20 22:51:16.154+00', '2026-03-20 21:20:16.998575+00'),
	(227, 'Air Europa', 'UX', 'UX', 'AEA', 'ES', 'approved', 'xlsx_import', false, '2026-03-20 22:51:10.237+00', '2026-03-20 21:20:16.976114+00'),
	(226, 'Atlas Air', '5Y', '5Y', 'GTI', 'US', 'approved', 'xlsx_import', false, '2026-03-20 22:51:17.389+00', '2026-03-20 21:20:16.973117+00'),
	(222, 'Azerbaijan Airlines', 'J2', 'J2', 'AHY', 'AZ', 'approved', 'xlsx_import', false, '2026-03-20 22:51:19.135+00', '2026-03-20 21:20:16.947813+00'),
	(102, 'TAL Aviation Group', NULL, NULL, NULL, 'IL', 'approved', 'iata_airlines', false, '2026-03-20 23:08:13.891+00', '2026-03-20 21:01:38.88021+00'),
	(19, 'British Airways', 'BA', 'BA', 'BAW', 'GB', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.64838+00', '2026-03-20 21:01:38.517172+00'),
	(42, 'flydubai', 'FZ', 'FZ', 'FDB', 'AE', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.764734+00', '2026-03-20 21:01:38.619982+00'),
	(26, 'KLM Royal Dutch Airlines', 'KL', 'KL', 'KLM', 'NL', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.884049+00', '2026-03-20 21:01:38.549969+00'),
	(27, 'Swiss International Air Lines', 'LX', 'LX', 'SWR', 'CH', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.926071+00', '2026-03-20 21:01:38.554845+00'),
	(7, 'Spirit Airlines', 'NK', 'NK', 'NKS', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:39.971625+00', '2026-03-20 21:01:38.46078+00'),
	(71, 'SpiceJet', 'SG', 'SG', 'SEJ', 'IN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.075642+00', '2026-03-20 21:01:38.747557+00'),
	(11, 'Sun Country Airlines', 'SY', 'SY', 'SCX', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.110411+00', '2026-03-20 21:01:38.479795+00'),
	(62, 'Thai Airways', 'TG', 'TG', 'THA', 'TH', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.115615+00', '2026-03-20 21:01:38.707668+00'),
	(38, 'Turkish Airlines', 'TK', 'TK', 'THY', 'TR', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.120264+00', '2026-03-20 21:01:38.602787+00'),
	(32, 'TAP Air Portugal', 'TP', 'TP', 'TAP', 'PT', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.124867+00', '2026-03-20 21:01:38.576784+00'),
	(90, 'Tunisair', 'TU', 'TU', 'TAR', 'TN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.14189+00', '2026-03-20 21:01:38.830492+00'),
	(21, 'easyJet', 'U2', 'U2', 'EZY', 'GB', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.147004+00', '2026-03-20 21:01:38.52621+00'),
	(96, 'Ural Airlines', 'U6', 'U6', 'SVR', 'RU', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.152988+00', '2026-03-20 21:01:38.855892+00'),
	(3, 'United Airlines', 'UA', 'UA', 'UAL', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.15862+00', '2026-03-20 21:01:38.441236+00'),
	(107, 'Sri Lankan Airlines', 'UL', 'UL', 'ALK', 'LK', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.164141+00', '2026-03-20 21:01:38.900493+00'),
	(94, 'Virgin Australia', 'VA', 'VA', 'VOZ', 'AU', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.175547+00', '2026-03-20 21:01:38.847986+00'),
	(74, 'VivaAerobus', 'VB', 'VB', 'VIV', 'MX', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.180746+00', '2026-03-20 21:01:38.760621+00'),
	(64, 'Vietnam Airlines', 'VN', 'VN', 'HVN', 'VN', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.186425+00', '2026-03-20 21:01:38.716743+00'),
	(20, 'Virgin Atlantic', 'VS', 'VS', 'VIR', 'GB', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.191621+00', '2026-03-20 21:01:38.521959+00'),
	(31, 'Vueling Airlines', 'VY', 'VY', 'VLG', 'ES', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.197915+00', '2026-03-20 21:01:38.572668+00'),
	(99, 'Wizz Air', 'W6', 'W6', 'WZZ', 'HU', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.203196+00', '2026-03-20 21:01:38.868798+00'),
	(4, 'Southwest Airlines', 'WN', 'WN', 'SWA', 'US', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.208505+00', '2026-03-20 21:01:38.44596+00'),
	(16, 'WestJet', 'WS', 'WS', 'WJA', 'CA', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.214022+00', '2026-03-20 21:01:38.503258+00'),
	(73, 'Volaris', 'Y4', 'Y4', 'VOI', 'MX', 'approved', 'iata_airlines', false, '2026-03-20 23:14:40.234778+00', '2026-03-20 21:01:38.756502+00') ON CONFLICT DO NOTHING;


--
-- Name: airlines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.airlines_id_seq', 473, true);


--
-- PostgreSQL database dump complete
--


