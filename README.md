# Wonderful Dragon Fruit South Africa Company

This repository contains the clean Wonderful Dragon Fruit South Africa application source. The live application is hosted on Manus AI with a Manus-managed server and database.

Repository: `healthyfieldsbushub/wonderful-dragon-fruit-south-africa`

The original project specification and development notes follow below.

The Zip file is an ecommerce app that I built on Manus AI. This application includes a production-ready full-stack ecommerce platform with AI integration, CRM integration, PDF/image catalog generation, and modern UI/UX.

## Current platform requirements

- Manus AI hosting, server runtime, and managed database
- Product catalog management with image processing and SEO metadata
- PayFast payment integration
- South African shipping integrations for The Courier Guy and PUDO
- Admin panel and product image uploads
- AI provider configuration and fallback support
- Zoho CRM integration where configured
- Responsive design and SEO-ready routes

## Development

```sh
npm install
npm run dev
```

The application uses runtime secrets supplied through the Manus Admin panel. Do not commit credentials or local `.env` files.
