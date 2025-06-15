#!/bin/bash

echo "Adding TypeScript fixes..."
git add src/utils/aiUtils.ts src/utils/calendarUtils.ts

echo "Committing fixes..."
git commit -m "Fix TypeScript errors for production build"

echo "Pushing to GitHub..."
git push origin main

echo "Fixes pushed! Now go back to Vercel and retry the deployment." 