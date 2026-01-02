#!/bin/bash

# Skills Improver - Quick Setup Script

echo "🚀 Skills Improver - Quick Setup"
echo "================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from example..."
  cp .env.example .env.local
  echo "✅ .env.local created"
  echo ""
  echo "⚠️  Please edit .env.local and add your:"
  echo "   - DATABASE_URL"
  echo "   - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET"
  echo "   - GROQ_API_KEY"
  echo ""
  read -p "Press enter when ready to continue..."
else
  echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️  Setting up database..."
pnpm prisma generate
pnpm prisma migrate dev --name init

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  pnpm dev"
echo ""
echo "📚 See SETUP.md for detailed instructions"
