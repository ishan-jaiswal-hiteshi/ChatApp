--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Postgres.app)
-- Dumped by pg_dump version 16.4

-- Started on 2024-12-12 12:46:52 IST

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 104679)
-- Name: Messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Messages" (
    id integer NOT NULL,
    "senderId" character varying(255) NOT NULL,
    "receiverId" character varying(255),
    "roomId" character varying(255),
    content text NOT NULL,
    "timestamp" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Messages" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 104678)
-- Name: Messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Messages_id_seq" OWNER TO postgres;

--
-- TOC entry 3664 (class 0 OID 0)
-- Dependencies: 221
-- Name: Messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Messages_id_seq" OWNED BY public."Messages".id;


--
-- TOC entry 220 (class 1259 OID 104660)
-- Name: RoomParticipants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoomParticipants" (
    id integer NOT NULL,
    "userId" character varying(255) NOT NULL,
    "roomId" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."RoomParticipants" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 104659)
-- Name: RoomParticipants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RoomParticipants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RoomParticipants_id_seq" OWNER TO postgres;

--
-- TOC entry 3665 (class 0 OID 0)
-- Dependencies: 219
-- Name: RoomParticipants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RoomParticipants_id_seq" OWNED BY public."RoomParticipants".id;


--
-- TOC entry 218 (class 1259 OID 104649)
-- Name: Rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rooms" (
    id integer NOT NULL,
    "roomId" character varying(255) NOT NULL,
    name character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Rooms" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 104648)
-- Name: Rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Rooms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Rooms_id_seq" OWNER TO postgres;

--
-- TOC entry 3666 (class 0 OID 0)
-- Dependencies: 217
-- Name: Rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Rooms_id_seq" OWNED BY public."Rooms".id;


--
-- TOC entry 216 (class 1259 OID 104636)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "userId" character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "socketId" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 104635)
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

--
-- TOC entry 3667 (class 0 OID 0)
-- Dependencies: 215
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- TOC entry 3485 (class 2604 OID 104682)
-- Name: Messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages" ALTER COLUMN id SET DEFAULT nextval('public."Messages_id_seq"'::regclass);


--
-- TOC entry 3484 (class 2604 OID 104663)
-- Name: RoomParticipants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomParticipants" ALTER COLUMN id SET DEFAULT nextval('public."RoomParticipants_id_seq"'::regclass);


--
-- TOC entry 3483 (class 2604 OID 104652)
-- Name: Rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rooms" ALTER COLUMN id SET DEFAULT nextval('public."Rooms_id_seq"'::regclass);


--
-- TOC entry 3482 (class 2604 OID 104639)
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- TOC entry 3658 (class 0 OID 104679)
-- Dependencies: 222
-- Data for Name: Messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (1, 'asd-DV5jMop', 'monty-M9iwdYW', NULL, 'monty bhai', '2024-12-12 12:21:47.643+05:30', '2024-12-12 12:21:47.644+05:30', '2024-12-12 12:21:47.644+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (2, 'monty-M9iwdYW', 'asd-DV5jMop', NULL, 'hello', '2024-12-12 12:22:10.722+05:30', '2024-12-12 12:22:10.722+05:30', '2024-12-12 12:22:10.722+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (3, 'asd-DV5jMop', 'monty-M9iwdYW', NULL, 'heyyy', '2024-12-12 12:22:13.602+05:30', '2024-12-12 12:22:13.602+05:30', '2024-12-12 12:22:13.602+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (4, 'monty-M9iwdYW', 'asd-DV5jMop', NULL, 'dfdf', '2024-12-12 12:22:16.05+05:30', '2024-12-12 12:22:16.05+05:30', '2024-12-12 12:22:16.05+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (5, 'monty-M9iwdYW', NULL, 'Room-xx-CmFbx7k', 'sdfsdf', '2024-12-12 12:22:30.553+05:30', '2024-12-12 12:22:30.553+05:30', '2024-12-12 12:22:30.553+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (6, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'dfsdf', '2024-12-12 12:22:34.539+05:30', '2024-12-12 12:22:34.539+05:30', '2024-12-12 12:22:34.539+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (7, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'sdfsdf', '2024-12-12 12:23:18.04+05:30', '2024-12-12 12:23:18.04+05:30', '2024-12-12 12:23:18.04+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (8, 'asd-DV5jMop', 'monty-M9iwdYW', NULL, 'sdf', '2024-12-12 12:33:38.119+05:30', '2024-12-12 12:33:38.119+05:30', '2024-12-12 12:33:38.119+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (9, 'asd-DV5jMop', 'monty-M9iwdYW', NULL, 'sdfsdf', '2024-12-12 12:33:51.095+05:30', '2024-12-12 12:33:51.095+05:30', '2024-12-12 12:33:51.095+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (10, 'monty-M9iwdYW', 'asd-DV5jMop', NULL, 'sdfsdf', '2024-12-12 12:33:57.367+05:30', '2024-12-12 12:33:57.367+05:30', '2024-12-12 12:33:57.367+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (11, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'sdfsdf', '2024-12-12 12:34:26.36+05:30', '2024-12-12 12:34:26.36+05:30', '2024-12-12 12:34:26.36+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (12, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'sdfsdf', '2024-12-12 12:34:36.913+05:30', '2024-12-12 12:34:36.913+05:30', '2024-12-12 12:34:36.913+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (13, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'sdf', '2024-12-12 12:34:41.296+05:30', '2024-12-12 12:34:41.296+05:30', '2024-12-12 12:34:41.296+05:30');
INSERT INTO public."Messages" (id, "senderId", "receiverId", "roomId", content, "timestamp", "createdAt", "updatedAt") VALUES (14, 'asd-DV5jMop', NULL, 'Room-xx-CmFbx7k', 'sdfsdfsdf', '2024-12-12 12:35:08.469+05:30', '2024-12-12 12:35:08.469+05:30', '2024-12-12 12:35:08.469+05:30');


--
-- TOC entry 3656 (class 0 OID 104660)
-- Dependencies: 220
-- Data for Name: RoomParticipants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."RoomParticipants" (id, "userId", "roomId", "createdAt", "updatedAt") VALUES (1, 'asd-DV5jMop', 'Room-xx-CmFbx7k', '2024-12-12 12:22:20.662+05:30', '2024-12-12 12:22:20.662+05:30');
INSERT INTO public."RoomParticipants" (id, "userId", "roomId", "createdAt", "updatedAt") VALUES (2, 'monty-M9iwdYW', 'Room-xx-CmFbx7k', '2024-12-12 12:22:25.519+05:30', '2024-12-12 12:22:25.519+05:30');


--
-- TOC entry 3654 (class 0 OID 104649)
-- Dependencies: 218
-- Data for Name: Rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Rooms" (id, "roomId", name, "createdAt", "updatedAt") VALUES (1, 'Room-xx-CmFbx7k', 'xx', '2024-12-12 12:22:20.659+05:30', '2024-12-12 12:22:20.659+05:30');


--
-- TOC entry 3652 (class 0 OID 104636)
-- Dependencies: 216
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Users" (id, name, "userId", email, password, "socketId", "createdAt", "updatedAt") VALUES (2, 'monty', 'monty-M9iwdYW', 'monty', '$2b$10$O7uk.HcHHqX0piBTgU0HbOL63Ustp6ETM0VnDYIiJs1XVoLFU7L3C', 'y7_14qDmi0XBTt1NAAAN', '2024-12-12 12:21:30.751+05:30', '2024-12-12 12:45:48.016+05:30');
INSERT INTO public."Users" (id, name, "userId", email, password, "socketId", "createdAt", "updatedAt") VALUES (3, 'ff', 'ff-aydEui0', 'ff@gmail.com', '$2b$10$j/iCp6ZMZ6oV.MBnY/5eWu.udqxrPwoP5eQrXJz2RDlvHftuUhRc6', 'ASoZCCjskuhCdeEaAAAV', '2024-12-12 12:46:04.066+05:30', '2024-12-12 12:46:50.403+05:30');
INSERT INTO public."Users" (id, name, "userId", email, password, "socketId", "createdAt", "updatedAt") VALUES (1, 'asd', 'asd-DV5jMop', 'asd', '$2b$10$YCMUN4nfl8XWYoCHZF2nNulpMdbz/xNFJ9IUX8JbN9xfCn6GsUWny', 'W4VanI_NIAFTBzBdAAAX', '2024-12-12 12:19:50.491+05:30', '2024-12-12 12:46:50.407+05:30');


--
-- TOC entry 3668 (class 0 OID 0)
-- Dependencies: 221
-- Name: Messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Messages_id_seq"', 14, true);


--
-- TOC entry 3669 (class 0 OID 0)
-- Dependencies: 219
-- Name: RoomParticipants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RoomParticipants_id_seq"', 2, true);


--
-- TOC entry 3670 (class 0 OID 0)
-- Dependencies: 217
-- Name: Rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Rooms_id_seq"', 1, true);


--
-- TOC entry 3671 (class 0 OID 0)
-- Dependencies: 215
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 3, true);


--
-- TOC entry 3505 (class 2606 OID 104686)
-- Name: Messages Messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_pkey" PRIMARY KEY (id);


--
-- TOC entry 3503 (class 2606 OID 104667)
-- Name: RoomParticipants RoomParticipants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomParticipants"
    ADD CONSTRAINT "RoomParticipants_pkey" PRIMARY KEY (id);


--
-- TOC entry 3497 (class 2606 OID 104656)
-- Name: Rooms Rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rooms"
    ADD CONSTRAINT "Rooms_pkey" PRIMARY KEY (id);


--
-- TOC entry 3499 (class 2606 OID 104707)
-- Name: Rooms Rooms_roomId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rooms"
    ADD CONSTRAINT "Rooms_roomId_key" UNIQUE ("roomId");


--
-- TOC entry 3501 (class 2606 OID 104709)
-- Name: Rooms Rooms_roomId_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rooms"
    ADD CONSTRAINT "Rooms_roomId_key1" UNIQUE ("roomId");


--
-- TOC entry 3487 (class 2606 OID 104701)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 3489 (class 2606 OID 104703)
-- Name: Users Users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key1" UNIQUE (email);


--
-- TOC entry 3491 (class 2606 OID 104643)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 3493 (class 2606 OID 104690)
-- Name: Users Users_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_userId_key" UNIQUE ("userId");


--
-- TOC entry 3495 (class 2606 OID 104692)
-- Name: Users Users_userId_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_userId_key1" UNIQUE ("userId");


--
-- TOC entry 3506 (class 2606 OID 104720)
-- Name: RoomParticipants RoomParticipants_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomParticipants"
    ADD CONSTRAINT "RoomParticipants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Rooms"("roomId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3507 (class 2606 OID 104715)
-- Name: RoomParticipants RoomParticipants_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomParticipants"
    ADD CONSTRAINT "RoomParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"("userId") ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2024-12-12 12:46:52 IST

--
-- PostgreSQL database dump complete
--

