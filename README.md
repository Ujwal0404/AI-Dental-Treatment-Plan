# AI Dental Treatment Plan Generator

A Next.js web application that generates comprehensive periodontal treatment plans using AI (Groq LLM).

## Features
- Patient information form with comprehensive input fields
- AI-powered treatment plan generation using Groq
- Professional formatting with detailed clinical recommendations
- PDF export functionality
- Mobile-friendly responsive design
- Mock data for testing

## Tech Stack
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Groq SDK for AI integration
- React Hook Form with Zod validation
- jsPDF for PDF generation

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with your Groq API key: `GROQ_API_KEY=your_key_here`
4. Run development server: `npm run dev`

## Usage
1. Fill out the patient form or use 'Add mock entry' for testing
2. Click 'Generate Plan' to create AI treatment plan
3. Edit the generated plan if needed
4. Export to PDF with treating dentist information

## Project Structure
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components (PatientForm, TreatmentPlanDisplay)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions (PDF export)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
MIT License