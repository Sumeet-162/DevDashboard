#!/bin/bash

# DevDash Production Deployment Setup Script
echo "🚀 Setting up DevDash for production deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found! Copying from .env.example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your actual values before deploying!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run build to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Your project is ready for deployment."
    echo ""
    echo "📋 Pre-deployment checklist:"
    echo "1. ✅ Dependencies installed"
    echo "2. ✅ Build successful"
    echo "3. ⚠️  Configure environment variables in your hosting platform"
    echo "4. ⚠️  Update GitHub OAuth callback URL"
    echo "5. ⚠️  Test Supabase connection"
    echo ""
    echo "🌐 Recommended platforms:"
    echo "  • Vercel (easiest): https://vercel.com"
    echo "  • Netlify: https://netlify.com"
    echo "  • Railway: https://railway.app"
    echo ""
    echo "📚 See deployment guide in README.md"
else
    echo "❌ Build failed! Please fix the errors before deploying."
fi
