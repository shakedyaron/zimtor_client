Zimtor

Zimtor is a web-based appointment management and booking platform designed for small businesses.

Business owners can create their business profile, configure services and weekly availability, manage appointments, and share a public booking page with their customers.

Features

* Business authentication and onboarding
* Business profile and service management
* Weekly availability configuration
* Public booking page with a unique business URL
* Dynamic appointment slot calculation based on service duration and availability
* Appointment management and history
* Customer appointment management
* Responsive interface for desktop and mobile
* End-to-end testing with Playwright

Tech Stack

Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Framer Motion

Backend & Database

* Supabase
* PostgreSQL
* Supabase Authentication

How It Works

Each business has a unique public booking page based on its business slug.

Customers can select a service, choose an available date and time, enter their details, and book an appointment.

Available time slots are calculated according to the business’s weekly availability, service duration, and existing appointments.

Business owners have access to a protected dashboard where they can configure their business and manage their appointments.

Architecture

The application uses React Router for navigation and protected routes for authenticated business pages.

Authentication state is managed globally using React Context and Supabase Auth.

Supabase is used as the backend platform, providing PostgreSQL database storage, authentication, and database APIs.

Booking availability logic is separated from the UI to handle working hours, service durations, and existing appointments.

Development

This project was developed using an AI-assisted workflow with tools including Claude and Codex. AI was used extensively during implementation, while I worked on defining the product requirements, application behavior, testing, debugging, and iterating on the system.

Status

Zimtor is an ongoing personal project and is still being actively developed.
