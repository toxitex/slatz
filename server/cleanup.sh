#!/bin/bash
set -e
DB=/var/www/synx-server/data/syncx.db
echo "=== BEFORE ==="
echo -n "users: "; sqlite3 "$DB" "SELECT COUNT(*) FROM users;"
echo -n "products: "; sqlite3 "$DB" "SELECT COUNT(*) FROM products;"
echo -n "coupons: "; sqlite3 "$DB" "SELECT COUNT(*) FROM coupons;"
sqlite3 "$DB" "DELETE FROM users; DELETE FROM products; DELETE FROM coupons;"
echo "=== AFTER (categories seed kept) ==="
echo -n "users: "; sqlite3 "$DB" "SELECT COUNT(*) FROM users;"
echo -n "products: "; sqlite3 "$DB" "SELECT COUNT(*) FROM products;"
echo -n "coupons: "; sqlite3 "$DB" "SELECT COUNT(*) FROM coupons;"
echo -n "categories: "; sqlite3 "$DB" "SELECT COUNT(*) FROM categories;"
