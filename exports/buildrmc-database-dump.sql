--
-- PostgreSQL database dump
--

\restrict zmcQEaMrEmAZkUZxuoO267zDWwCPRlr6aY5iDlu8TxXa6tGyjPCCYhv1axdnOT6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date text NOT NULL,
    check_in text,
    check_out text,
    status text DEFAULT 'present'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    contact text NOT NULL,
    email text,
    gst_number text,
    credit_terms text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_challans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_challans (
    id integer NOT NULL,
    dc_number text NOT NULL,
    dc_date text NOT NULL,
    invoice_id integer,
    vehicle_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    destination text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: delivery_challans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delivery_challans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_challans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delivery_challans_id_seq OWNED BY public.delivery_challans.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name text NOT NULL,
    department text NOT NULL,
    designation text NOT NULL,
    email text,
    phone text,
    salary numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    join_date text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: inventory_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_entries (
    id integer NOT NULL,
    product_id integer NOT NULL,
    entry_date text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    type text NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_entries_id_seq OWNED BY public.inventory_entries.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    invoice_date text NOT NULL,
    customer_id integer NOT NULL,
    total_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    plant text,
    loaded_plant text,
    km_reading numeric(10,2),
    block text,
    site text,
    invoice_time text,
    driver_name text,
    vehicle_id integer,
    vehicle_no text,
    pump_type text,
    grade text,
    loaded_grade text,
    loaded_quantity numeric(10,2),
    quantity numeric(10,2),
    net_amount numeric(12,2),
    net_price numeric(12,2),
    pump_charge numeric(12,2),
    transport_charge numeric(12,2),
    cgst_rate numeric(5,2),
    sgst_rate numeric(5,2),
    igst_rate numeric(5,2),
    remark text,
    is_bill_received boolean DEFAULT false NOT NULL
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id integer NOT NULL,
    entry_date text NOT NULL,
    account_id integer NOT NULL,
    debit numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    credit numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    description text NOT NULL,
    reference_id integer,
    reference_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ledger_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ledger_entries_id_seq OWNED BY public.ledger_entries.id;


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month text NOT NULL,
    gross_pay numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    deductions numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    net_pay numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_id_seq OWNED BY public.payroll.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    unit text NOT NULL,
    unit_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    stock_qty numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    min_stock_level numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number text NOT NULL,
    order_date text NOT NULL,
    customer_id integer NOT NULL,
    total_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: qc_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qc_tests (
    id integer NOT NULL,
    test_date text NOT NULL,
    sample_code text NOT NULL,
    slump numeric(8,2) NOT NULL,
    strength numeric(8,2) NOT NULL,
    grade text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: qc_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qc_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qc_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qc_tests_id_seq OWNED BY public.qc_tests.id;


--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    order_date text NOT NULL,
    customer_id integer NOT NULL,
    total_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    delivery_date text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_orders_id_seq OWNED BY public.sales_orders.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    trip_date text NOT NULL,
    vehicle_id integer NOT NULL,
    destination text NOT NULL,
    load_qty numeric(10,2) NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    driver_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'operator'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    registration_no text NOT NULL,
    model text NOT NULL,
    capacity numeric(8,2) NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    driver_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_challans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_challans ALTER COLUMN id SET DEFAULT nextval('public.delivery_challans_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: inventory_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_entries ALTER COLUMN id SET DEFAULT nextval('public.inventory_entries_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: ledger_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries ALTER COLUMN id SET DEFAULT nextval('public.ledger_entries_id_seq'::regclass);


--
-- Name: payroll id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll ALTER COLUMN id SET DEFAULT nextval('public.payroll_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: qc_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_tests ALTER COLUMN id SET DEFAULT nextval('public.qc_tests_id_seq'::regclass);


--
-- Name: sales_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders ALTER COLUMN id SET DEFAULT nextval('public.sales_orders_id_seq'::regclass);


--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, code, name, type, balance, created_at, updated_at) FROM stdin;
1	1001	Cash Account	asset	850000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
2	1002	Accounts Receivable	asset	1200000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
3	2001	Accounts Payable	liability	450000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
4	3001	Sales Revenue	income	5600000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
5	4001	Raw Material Expense	expense	2800000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
6	4002	Labour Expense	expense	1200000.00	2026-04-26 23:07:25.252181+00	2026-04-26 23:07:25.252181+00
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, employee_id, date, check_in, check_out, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, address, contact, email, gst_number, credit_terms, created_at, updated_at) FROM stdin;
1	Fortune Builders Pvt Ltd	12 Industrial Area, Pune	+91-9876543210	contact@fortunebuilders.in	GSTIN22AAAAA0000A1Z5	30 days	2026-04-26 23:06:12.935566+00	2026-04-26 23:06:12.935566+00
2	Skyline Constructions	45 MG Road, Bangalore	+91-8765432109	info@skylinecon.com	GSTIN29BBBBB1111B2Y6	45 days	2026-04-26 23:06:12.935566+00	2026-04-26 23:06:12.935566+00
3	Prime Infrastructure	88 Nehru Nagar, Mumbai	+91-7654321098	ops@primeinfra.co.in	GSTIN27CCCCC2222C3X7	60 days	2026-04-26 23:06:12.935566+00	2026-04-26 23:06:12.935566+00
4	BuildTech Solutions	Plot 5, MIDC Nashik	+91-6543210987	bd@buildtech.in	GSTIN27DDDDD3333D4W8	30 days	2026-04-26 23:06:12.935566+00	2026-04-26 23:06:12.935566+00
5	Metro Roads Corp	22 Civil Lines, Nagpur	+91-5432109876	metro@metroroads.in	GSTIN27EEEEE4444E5V9	15 days	2026-04-26 23:06:12.935566+00	2026-04-26 23:06:12.935566+00
\.


--
-- Data for Name: delivery_challans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_challans (id, dc_number, dc_date, invoice_id, vehicle_id, status, destination, created_at, updated_at) FROM stdin;
1	DC-2026-001	2026-01-15	1	1	delivered	Fortune Builders Site, Pune	2026-04-26 23:07:03.853779+00	2026-04-26 23:07:03.853779+00
2	DC-2026-002	2026-02-20	3	2	delivered	Prime Infrastructure, Mumbai	2026-04-26 23:07:03.853779+00	2026-04-26 23:07:03.853779+00
3	DC-2026-003	2026-03-25	5	3	in-transit	Metro Roads, Nagpur	2026-04-26 23:07:03.853779+00	2026-04-26 23:07:03.853779+00
4	DC-2026-004	2026-04-05	6	1	delivered	Fortune Builders Phase 2, Pune	2026-04-26 23:07:03.853779+00	2026-04-26 23:07:03.853779+00
5	DC-2026-005	2026-04-18	7	4	pending	Skyline Constructions, Bangalore	2026-04-26 23:07:03.853779+00	2026-04-26 23:07:03.853779+00
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, name, department, designation, email, phone, salary, join_date, status, created_at, updated_at) FROM stdin;
1	Anil Sharma	Production	Plant Manager	anil@fortune.in	+91-9876543001	75000.00	2020-01-15	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
2	Priya Patel	Accounts	Senior Accountant	priya@fortune.in	+91-9876543002	55000.00	2020-03-20	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
3	Ravi Kumar	Transport	Fleet Supervisor	ravi@fortune.in	+91-9876543003	48000.00	2021-06-10	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
4	Sunita Verma	HR	HR Manager	sunita@fortune.in	+91-9876543004	60000.00	2019-11-05	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
5	Mohan Das	QC	QC Engineer	mohan@fortune.in	+91-9876543005	52000.00	2022-02-28	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
6	Kavita Reddy	Sales	Sales Executive	kavita@fortune.in	+91-9876543006	42000.00	2022-08-15	active	2026-04-26 23:07:00.089419+00	2026-04-26 23:07:00.089419+00
\.


--
-- Data for Name: inventory_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_entries (id, product_id, entry_date, quantity, type, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, invoice_date, customer_id, total_amount, status, due_date, created_at, updated_at, plant, loaded_plant, km_reading, block, site, invoice_time, driver_name, vehicle_id, vehicle_no, pump_type, grade, loaded_grade, loaded_quantity, quantity, net_amount, net_price, pump_charge, transport_charge, cgst_rate, sgst_rate, igst_rate, remark, is_bill_received) FROM stdin;
2	INV-2026-002	2026-02-03	2	187500.00	pending	2026-03-03	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
3	INV-2026-003	2026-02-20	3	312000.00	paid	2026-03-20	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
4	INV-2026-004	2026-03-10	4	98750.00	overdue	2026-04-10	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
5	INV-2026-005	2026-03-25	5	456000.00	pending	2026-04-25	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
6	INV-2026-006	2026-04-05	1	189000.00	paid	2026-05-05	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
7	INV-2026-007	2026-04-18	2	267500.00	pending	2026-05-18	2026-04-26 23:06:32.823231+00	2026-04-26 23:06:32.823231+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
8	INV-2604-5078	2026-04-30	1	61360.00	pending	2026-05-30	2026-04-30 02:44:41.988334+00	2026-04-30 02:44:41.988334+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
9	INV-2604-4632	2026-04-30	1	29500.00	pending	2026-05-30	2026-04-30 02:48:09.99331+00	2026-04-30 02:48:09.99331+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
10	26-27/1212	2026-04-30	1	56050.00	pending	\N	2026-04-30 02:55:26.675216+00	2026-04-30 02:55:26.675216+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
11	26-27/7877	2026-04-30	1	63720.00	pending	\N	2026-04-30 02:58:51.383573+00	2026-04-30 02:58:51.383573+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
12	26-27/6397	2026-04-30	1	58500.00	pending	\N	2026-04-30 03:04:18.933426+00	2026-04-30 03:04:18.933426+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
1	INV-2026-001	2026-01-15	1	225000.00	paid	2026-02-15	2026-04-26 23:06:32.823231+00	2026-05-06 03:19:21.478+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ledger_entries (id, entry_date, account_id, debit, credit, description, reference_id, reference_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll (id, employee_id, month, gross_pay, deductions, net_pay, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, category, unit, unit_price, stock_qty, min_stock_level, created_at, updated_at) FROM stdin;
1	M20 Concrete Mix	Ready Mix	CUM	4500.00	500.00	100.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
2	M25 Concrete Mix	Ready Mix	CUM	5200.00	350.00	80.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
3	M30 Concrete Mix	Ready Mix	CUM	6100.00	200.00	50.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
4	OPC 53 Cement	Raw Material	BAG	420.00	1000.00	200.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
5	River Sand	Aggregate	TON	850.00	800.00	150.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
6	20mm Crushed Stone	Aggregate	TON	650.00	1200.00	200.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
7	10mm Stone Chips	Aggregate	TON	700.00	900.00	150.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
8	Plasticizer Admixture	Chemical	LTR	180.00	500.00	100.00	2026-04-26 23:06:16.723544+00	2026-04-26 23:06:16.723544+00
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, po_number, order_date, customer_id, total_amount, status, created_at, updated_at) FROM stdin;
1	PO-2026-001	2026-01-10	1	225000.00	approved	2026-04-26 23:06:36.932902+00	2026-04-26 23:06:36.932902+00
2	PO-2026-002	2026-02-01	2	187500.00	pending	2026-04-26 23:06:36.932902+00	2026-04-26 23:06:36.932902+00
3	PO-2026-003	2026-02-18	3	312000.00	approved	2026-04-26 23:06:36.932902+00	2026-04-26 23:06:36.932902+00
4	PO-2026-004	2026-03-08	4	98750.00	pending	2026-04-26 23:06:36.932902+00	2026-04-26 23:06:36.932902+00
5	PO-2026-005	2026-03-22	5	456000.00	approved	2026-04-26 23:06:36.932902+00	2026-04-26 23:06:36.932902+00
\.


--
-- Data for Name: qc_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.qc_tests (id, test_date, sample_code, slump, strength, grade, status, remarks, created_at, updated_at) FROM stdin;
1	2026-01-20	QC-2026-001	100.00	25.60	M25	passed	Sample from INV-001 batch	2026-04-26 23:07:21.432655+00	2026-04-26 23:07:21.432655+00
2	2026-02-05	QC-2026-002	120.00	22.30	M20	passed	Standard mix test	2026-04-26 23:07:21.432655+00	2026-04-26 23:07:21.432655+00
3	2026-02-25	QC-2026-003	95.00	31.20	M30	passed	High strength mix	2026-04-26 23:07:21.432655+00	2026-04-26 23:07:21.432655+00
4	2026-03-15	QC-2026-004	130.00	19.80	M20	failed	Slump too high, below strength	2026-04-26 23:07:21.432655+00	2026-04-26 23:07:21.432655+00
5	2026-04-10	QC-2026-005	105.00	26.10	M25	passed	Routine check	2026-04-26 23:07:21.432655+00	2026-04-26 23:07:21.432655+00
\.


--
-- Data for Name: sales_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_orders (id, order_number, order_date, customer_id, total_amount, status, delivery_date, created_at, updated_at) FROM stdin;
1	SO-2026-001	2026-01-12	1	225000.00	completed	2026-01-15	2026-04-26 23:07:28.950751+00	2026-04-26 23:07:28.950751+00
2	SO-2026-002	2026-02-01	2	187500.00	pending	2026-02-05	2026-04-26 23:07:28.950751+00	2026-04-26 23:07:28.950751+00
3	SO-2026-003	2026-03-18	3	312000.00	completed	2026-02-20	2026-04-26 23:07:28.950751+00	2026-04-26 23:07:28.950751+00
4	SO-2026-004	2026-04-01	4	98750.00	processing	2026-03-10	2026-04-26 23:07:28.950751+00	2026-04-26 23:07:28.950751+00
5	SO-2026-005	2026-04-15	5	456000.00	confirmed	2026-03-25	2026-04-26 23:07:28.950751+00	2026-04-26 23:07:28.950751+00
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trips (id, trip_date, vehicle_id, destination, load_qty, status, driver_name, created_at, updated_at) FROM stdin;
1	2026-01-15	1	Fortune Builders Site	7.50	completed	Rajesh Kumar	2026-04-26 23:07:32.773388+00	2026-04-26 23:07:32.773388+00
2	2026-02-20	2	Prime Infrastructure Site	9.00	completed	Suresh Patil	2026-04-26 23:07:32.773388+00	2026-04-26 23:07:32.773388+00
3	2026-03-25	3	Metro Roads Site	7.50	in-progress	Mahesh Singh	2026-04-26 23:07:32.773388+00	2026-04-26 23:07:32.773388+00
4	2026-04-05	1	Fortune Phase 2 Site	7.50	completed	Rajesh Kumar	2026-04-26 23:07:32.773388+00	2026-04-26 23:07:32.773388+00
5	2026-04-18	4	Skyline Constructions	42.00	scheduled	Venkat Rao	2026-04-26 23:07:32.773388+00	2026-04-26 23:07:32.773388+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, full_name, email, role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, registration_no, model, capacity, status, driver_name, created_at, updated_at) FROM stdin;
1	MH12-AB-1234	TATA Transit Mixer 7.5 CUM	7.50	available	Rajesh Kumar	2026-04-26 23:06:56.261672+00	2026-04-26 23:06:56.261672+00
2	MH12-CD-5678	SCHWING Transit Mixer 9 CUM	9.00	in-service	Suresh Patil	2026-04-26 23:06:56.261672+00	2026-04-26 23:06:56.261672+00
3	MH12-EF-9012	TATA Transit Mixer 7.5 CUM	7.50	available	Mahesh Singh	2026-04-26 23:06:56.261672+00	2026-04-26 23:06:56.261672+00
4	MH12-GH-3456	Putzmeister Pump Truck	42.00	available	Venkat Rao	2026-04-26 23:06:56.261672+00	2026-04-26 23:06:56.261672+00
5	MH12-IJ-7890	AJAX Transit Mixer 9 CUM	9.00	maintenance	Dilip Pawar	2026-04-26 23:06:56.261672+00	2026-04-26 23:06:56.261672+00
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 6, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 5, true);


--
-- Name: delivery_challans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.delivery_challans_id_seq', 5, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 6, true);


--
-- Name: inventory_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_entries_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 12, true);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ledger_entries_id_seq', 1, false);


--
-- Name: payroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 8, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 5, true);


--
-- Name: qc_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.qc_tests_id_seq', 5, true);


--
-- Name: sales_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_orders_id_seq', 5, true);


--
-- Name: trips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trips_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 5, true);


--
-- Name: accounts accounts_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_code_unique UNIQUE (code);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_challans delivery_challans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_challans
    ADD CONSTRAINT delivery_challans_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: inventory_entries inventory_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_entries
    ADD CONSTRAINT inventory_entries_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: qc_tests qc_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_tests
    ADD CONSTRAINT qc_tests_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_registration_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_registration_no_unique UNIQUE (registration_no);


--
-- PostgreSQL database dump complete
--

\unrestrict zmcQEaMrEmAZkUZxuoO267zDWwCPRlr6aY5iDlu8TxXa6tGyjPCCYhv1axdnOT6

