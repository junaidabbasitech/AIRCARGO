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
-- Data for Name: ground_handlers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.ground_handlers VALUES (1, 'WFS (Worldwide Flight Services)', NULL, NULL, '718-656-3980', 'ekimport@wfs.aero', 'Cargo handling, import/export', '2026-03-20 21:20:17.050659+00', '2026-03-20 21:20:17.050659+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (2, 'Alliance Ground International', NULL, NULL, '973-206-0660', 'agiekewr@allianceground.com', 'Ground handling, cargo', '2026-03-20 21:20:17.054731+00', '2026-03-20 21:20:17.054731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (3, 'Mercury Air Cargo', NULL, NULL, '310-258-6100', 'ekimport@mercuryair.com', 'Cargo handling', '2026-03-20 21:20:17.058656+00', '2026-03-20 21:20:17.058656+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (4, 'Airport Logistics / Maestro Cargo', NULL, NULL, '773-686-0700', 'ordres@emirates.com', 'Logistics, cargo', '2026-03-20 21:20:17.06155+00', '2026-03-20 21:20:17.06155+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (5, 'WFF (Worldwide Freight Forwarders)', NULL, NULL, '718-880-3417', 'jfktkimp@allianceground.com', 'Freight forwarding', '2026-03-20 21:20:17.064916+00', '2026-03-20 21:20:17.064916+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (6, 'Midwest Express Handling', NULL, NULL, '800-726-6654', NULL, 'Ground handling', '2026-03-20 21:20:17.068359+00', '2026-03-20 21:20:17.068359+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (7, 'Epic Cargo', NULL, NULL, '832-827-5830', NULL, 'Cargo handling, ISC', '2026-03-20 21:20:17.071995+00', '2026-03-20 21:20:17.071995+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (8, 'Swissport', NULL, NULL, '404-767-8785', 'atlekops@swissport.com', 'Ground handling, cargo', '2026-03-20 21:20:17.079064+00', '2026-03-20 21:20:17.079064+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (9, 'Special Services Corp', NULL, NULL, NULL, NULL, 'Special cargo services', '2026-03-20 21:20:17.08241+00', '2026-03-20 21:20:17.08241+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (10, 'TGT Trucking', NULL, NULL, NULL, NULL, 'Cargo trucking', '2026-03-20 21:20:17.085727+00', '2026-03-20 21:20:17.085727+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (11, 'CAS (Cargo Airline Services)', NULL, NULL, '703-840-8392', NULL, 'Cargo handling', '2026-03-20 21:20:17.089667+00', '2026-03-20 21:20:17.089667+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (12, 'DHL Hub Services', NULL, NULL, NULL, 'jfkimport@dlh.de', 'Express cargo', '2026-03-20 21:20:17.092713+00', '2026-03-20 21:20:17.092713+00') ON CONFLICT DO NOTHING;
INSERT INTO public.ground_handlers VALUES (13, 'Nas Handling', NULL, NULL, '305-871-9001', 'turkish@nashandling.aero', 'Ground handling', '2026-03-20 21:20:17.09585+00', '2026-03-20 21:20:17.09585+00') ON CONFLICT DO NOTHING;


--
-- Name: ground_handlers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ground_handlers_id_seq', 13, true);


--
-- PostgreSQL database dump complete
--


