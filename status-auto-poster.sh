#!/bin/bash
echo "📊 Auto-Poster Status:"
pm2 status auto-poster
echo ""
echo "📋 Recent Logs:"
pm2 logs auto-poster --lines 20
